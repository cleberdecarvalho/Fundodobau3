<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Cache-Control, Pragma, Expires, X-Endpoint');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
header('X-App-Version: 2025-08-09-02');

// Configuração do banco
$host = getenv('DB_HOST') ?: 'localhost';
$db = getenv('DB_NAME') ?: 'fundod14_fundodobau'; // Nome do banco (fallback)
$user = getenv('DB_USER') ?: 'fundod14_fundodobau'; // Usuário do banco (fallback)
$pass = getenv('DB_PASS') ?: '4z]8(AHekxVr'; // Senha do banco (fallback)
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao conectar ao banco de dados: ' . $e->getMessage()]);
    exit;
}

// Endpoint rápido de verificação de versão
if (isset($_GET['action']) && $_GET['action'] === 'version') {
    echo json_encode(['ok' => true, 'version' => '2025-08-09-02']);
    exit;
}

// ===== Utilitário simples de log para diagnóstico no servidor =====
function fdb_log($lines) {
    try {
        $f = __DIR__ . '/bunny_upload_debug.log';
        $ts = date('Y-m-d H:i:s');
        if (is_array($lines)) { $lines = json_encode($lines, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE); }
        @file_put_contents($f, "[$ts] " . $lines . "\n", FILE_APPEND);
    } catch (Throwable $e) { /* ignora */ }
}

// Headers de debug serão definidos mais abaixo, após resolver método/endpoint

// Garante que a tabela 'sliders' exista e que 'filmesIds' seja TEXT (compatível com MySQL/MariaDB antigos)
function ensureSlidersTable($pdo) {
    // Cria a tabela se não existir com filmesIds como TEXT
    $pdo->exec("CREATE TABLE IF NOT EXISTS sliders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        tipo ENUM('categoria','decada','personalizado') NOT NULL,
        filtro VARCHAR(50) DEFAULT NULL,
        filmesIds TEXT DEFAULT NULL,
        ativo TINYINT(1) DEFAULT 1,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // Se por acaso a coluna estiver como JSON, converte para TEXT
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM sliders LIKE 'filmesIds'");
        $col = $stmt ? $stmt->fetch() : null;
        if ($col && isset($col['Type']) && stripos($col['Type'], 'json') !== false) {
            $pdo->exec("ALTER TABLE sliders MODIFY filmesIds TEXT NULL");
        }
    } catch (Throwable $e) {
        // Evita quebrar a API em hosts sem permissão de ALTER, segue execução
    }
}

// Função para gerar GUID
function generateGUID() {
    if (function_exists('com_create_guid')) {
        return trim(com_create_guid(), '{}');
    }
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

// Função para verificar autenticação
function getCurrentUser($pdo) {
    $headers = getallheaders();
    $token = null;
    
    if (isset($headers['Authorization'])) {
        $token = str_replace('Bearer ', '', $headers['Authorization']);
    }
    
    if (!$token) {
        return null;
    }
    
    // Em produção, usar JWT ou similar
    // Aqui vamos usar uma abordagem simples com session
    session_start();
    if (isset($_SESSION['user_id'])) {
        $stmt = $pdo->prepare("SELECT id, nome, email, tipo, avatar FROM usuarios WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        return $stmt->fetch();
    }
    
    return null;
}

// Função para login
function login($pdo, $email, $senha) {
    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if ($user && password_verify($senha, $user['senha'])) {
        session_start();
        $_SESSION['user_id'] = $user['id'];
        
        unset($user['senha']); // Não retornar senha
        return $user;
    }
    
    return null;
}

// Função para registrar usuário
function register($pdo, $nome, $email, $senha) {
    // Verificar se email já existe
    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        return ['error' => 'Email já cadastrado'];
    }
    
    $senhaHash = password_hash($senha, PASSWORD_DEFAULT);
    
    $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)");
    if ($stmt->execute([$nome, $email, $senhaHash])) {
        $userId = $pdo->lastInsertId();
        session_start();
        $_SESSION['user_id'] = $userId;
        
        return [
            'id' => $userId,
            'nome' => $nome,
            'email' => $email,
            'tipo' => 'usuario'
        ];
    }
    
    return ['error' => 'Erro ao criar usuário'];
}

$method = $_SERVER['REQUEST_METHOD'];
$rawUri = $_SERVER['REQUEST_URI'] ?? '';
$path = parse_url($rawUri, PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Rota base da API
// Tornar dinâmico pelo nome do script atual (ex.: api-filmes.php ou api-filmes2.php)
$script = basename($_SERVER['SCRIPT_NAME']);
$apiPath = end($pathParts) === $script ? '' : ($script . '/');
$endpoint = str_replace($apiPath, '', implode('/', $pathParts));

// Parâmetros GET
$action = $_GET['action'] ?? '';

// Permitir forçar o endpoint via query (?endpoint=... ) para QUALQUER método
if (isset($_GET['endpoint']) && $_GET['endpoint']) {
    $endpoint = $_GET['endpoint'];
}
// Fallback adicional: permitir header X-Endpoint (ex.: quando a query é perdida em PUT)
if (isset($_SERVER['HTTP_X_ENDPOINT']) && $_SERVER['HTTP_X_ENDPOINT']) {
    $endpoint = $_SERVER['HTTP_X_ENDPOINT'];
}
// Debug: refletir o header recebido
header('X-Received-X-Endpoint: ' . (isset($_SERVER['HTTP_X_ENDPOINT']) ? (string)$_SERVER['HTTP_X_ENDPOINT'] : ''));

// Normalização do endpoint vindo de query/header/body
$endpoint = urldecode((string)$endpoint);
$endpoint = trim($endpoint);
$endpoint = ltrim($endpoint, '/');

// Log de início de request
fdb_log([
    'phase' => 'start',
    'method' => $method,
    'rawUri' => ($rawUri ?? ''),
    'endpoint' => $endpoint,
    'queryEndpoint' => ($_GET['endpoint'] ?? ''),
    'xEndpoint' => ($_SERVER['HTTP_X_ENDPOINT'] ?? ''),
    'contentType' => ($_SERVER['CONTENT_TYPE'] ?? ($_SERVER['HTTP_CONTENT_TYPE'] ?? '')),
]);

// Para requisições POST, verificar se o endpoint está no body
if ($method === 'POST') {
    // Quando JSON: endpoint pode vir no corpo
    $input = json_decode(file_get_contents('php://input'), true);
    if (isset($input['endpoint']) && $input['endpoint']) {
        $endpoint = $input['endpoint'];
    }
    // Quando multipart/form-data: endpoint pode vir nos campos do formulário
    if (isset($_POST['endpoint']) && $_POST['endpoint']) {
        $endpoint = $_POST['endpoint'];
    }
}

if ($method === 'OPTIONS') {
    exit;
}

// ============================
// Utilitários Bunny (chave no MySQL)
// ============================
// Ajuste estes valores conforme necessário
if (!defined('BUNNY_LIBRARY_ID')) {
    define('BUNNY_LIBRARY_ID', '256964'); // confirme seu libraryId
}
if (!defined('BUNNY_AES_KEY')) {
    define('BUNNY_AES_KEY', 'mu8Xz!3rPqKu8Xz!3rPqKu8Xz!3rPqK-2025-Prod'); // a MESMA usada no AES_ENCRYPT do INSERT
}
// Permitir relaxar verificação SSL em ambientes de hosting compartilhado
if (!defined('BUNNY_CURL_RELAX_SSL')) {
    define('BUNNY_CURL_RELAX_SSL', true);
}

/**
 * Lê a Bunny API Key descriptografando a última linha da tabela bunny.
 */
function fdb_get_bunny_key(PDO $pdo): string {
    try {
        // Aceitar tanto VARBINARY puro quanto HEX string
        $sql = "SELECT 
            AES_DECRYPT(
                CASE WHEN codigo REGEXP '^[0-9A-Fa-f]+' THEN UNHEX(codigo) ELSE codigo END,
                ?
            ) AS k
        FROM bunny ORDER BY id DESC LIMIT 1";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([BUNNY_AES_KEY]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row || !isset($row['k']) || $row['k'] === null) return '';
        $key = $row['k'];
        if (!is_string($key)) { $key = (string)$key; }
        return trim($key);
    } catch (Throwable $e) {
        return '';
    }
}

/**
 * Realiza requisição à Bunny Stream API.
 */
function fdb_bunny_request(string $method, string $path, string $accessKey, ?array $body = null): array {
    $base = 'https://video.bunnycdn.com/library';
    $url = rtrim($base, '/') . '/' . rawurlencode(BUNNY_LIBRARY_ID) . '/' . ltrim($path, '/');
    $headers = [
        'AccessKey: ' . $accessKey,
        'Content-Type: application/json',
        'Accept: application/json',
    ];

    // Preferir cURL em hosts que bloqueiam URL fopen
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        }
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);
        if (BUNNY_CURL_RELAX_SSL) {
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        } else {
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
        }
        $resp = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $err = curl_error($ch);
        curl_close($ch);
        $json = is_string($resp) ? json_decode($resp, true) : null;
        return ['status' => $status, 'body' => $json, 'raw' => $resp, 'curl_error' => $err];
    }

    // Fallback: file_get_contents
    $opts = [
        'http' => [
            'method' => $method,
            'header' => implode("\r\n", $headers) . "\r\n",
            'ignore_errors' => true,
        ]
    ];
    if ($body !== null) {
        $opts['http']['content'] = json_encode($body);
    }
    $ctx = stream_context_create($opts);
    $resp = @file_get_contents($url, false, $ctx);
    $status = 0;
    if (isset($http_response_header[0]) && preg_match('#HTTP/\\d+\.\\d+\\s+(\\d{3})#', $http_response_header[0], $m)) {
        $status = (int)$m[1];
    }
    $json = null;
    if ($resp !== false) {
        $json = json_decode($resp, true);
    }
    return ['status' => $status, 'body' => $json, 'raw' => $resp];
}

/**
 * Monta o iframe de embed para um GUID fornecido
 */
function fdb_embed_iframe(string $videoGUID): string {
    $src = "https://iframe.mediadelivery.net/embed/" . rawurlencode(BUNNY_LIBRARY_ID) . "/" . rawurlencode($videoGUID) . "?autoplay=false&loop=false&muted=false&preload=true&responsive=true";
    return '<iframe src="' . htmlspecialchars($src, ENT_QUOTES) . '" allowfullscreen="true"></iframe>';
}

try {
    switch ($method) {
        case 'GET':
            // Bunny - obter status de vídeo por GUID
            if (preg_match('/^bunny\\/videos\\/([A-Za-z0-9\-]+)$/', $endpoint, $m)) {
                $guid = $m[1];
                $key = fdb_get_bunny_key($pdo);
                if (!$key) {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'error' => 'Bunny API Key not found']);
                    break;
                }
                $r = fdb_bunny_request('GET', 'videos/' . $guid, $key, null);
                if ($r['status'] >= 200 && $r['status'] < 300 && is_array($r['body'])) {
                    $status = 'Processando';
                    if (!empty($r['body']['status']) && (int)$r['body']['status'] === 4) {
                        $status = 'Processado';
                    } elseif (!empty($r['body']['transcodingStatus']) && strtolower($r['body']['transcodingStatus']) === 'finished') {
                        $status = 'Processado';
                    }
                    echo json_encode(['success' => true, 'videoGUID' => $guid, 'status' => $status, 'bunny' => $r['body']]);
                    break;
                }
                http_response_code($r['status'] ?: 502);
                echo json_encode(['success' => false, 'error' => 'Bunny status failed', 'details' => $r['body'] ?: $r['raw'], 'curl_error' => ($r['curl_error'] ?? null)]);
                break;
            }
            // Carrossel - listar itens
            if ($endpoint === 'carrossel') {
                $stmt = $pdo->prepare("SELECT id, posicao, filmeId, imagemUrl, ativo, createdAt, updatedAt FROM carrossel ORDER BY posicao ASC");
                $stmt->execute();
                $items = $stmt->fetchAll();
                echo json_encode(['success' => true, 'carrossel' => $items]);
                break;
            }

            // Sliders - listar todos
            if ($endpoint === 'sliders') {
                // Garantir tabela e esquema compatível
                ensureSlidersTable($pdo);

                $stmt = $pdo->prepare("SELECT id, titulo, tipo, filtro, filmesIds, ativo, createdAt, updatedAt FROM sliders ORDER BY id ASC");
                $stmt->execute();
                $sliders = $stmt->fetchAll();
                foreach ($sliders as &$s) {
                    $s['filmesIds'] = $s['filmesIds'] ? json_decode($s['filmesIds'], true) : [];
                }
                echo json_encode(['success' => true, 'sliders' => $sliders]);
                break;
            }

            // Listar filmes
            if ($action === 'list') {
                // Parâmetros de paginação/busca/ordenação
                $page = max(1, (int)($_GET['page'] ?? 1));
                $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));
                $q = trim($_GET['q'] ?? '');
                $sort = $_GET['sort'] ?? 'createdAt';
                $order = strtolower($_GET['order'] ?? 'desc');

                // Whitelist de ordenação
                $allowedSort = ['createdAt', 'updatedAt', 'ano', 'nomePortugues', 'nomeOriginal'];
                if (!in_array($sort, $allowedSort, true)) { $sort = 'createdAt'; }
                $order = $order === 'asc' ? 'ASC' : 'DESC';

                $where = [];
                $params = [];
                if ($q !== '') {
                    $where[] = '(nomePortugues LIKE ? OR nomeOriginal LIKE ?)';
                    $like = '%' . $q . '%';
                    $params[] = $like;
                    $params[] = $like;
                }
                $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

                // Total de registros
                $stmtCount = $pdo->prepare("SELECT COUNT(*) as total FROM filmes $whereSql");
                $stmtCount->execute($params);
                $total = (int)$stmtCount->fetchColumn();

                $offset = ($page - 1) * $limit;

                // Consulta paginada
                $sql = "SELECT * FROM filmes $whereSql ORDER BY $sort $order LIMIT ? OFFSET ?";
                $stmt = $pdo->prepare($sql);
                $bindParams = $params;
                $bindParams[] = $limit;
                $bindParams[] = $offset;
                // Bind manual para LIMIT/OFFSET como inteiros
                $i = 1;
                foreach ($params as $p) { $stmt->bindValue($i++, $p, PDO::PARAM_STR); }
                $stmt->bindValue($i++, (int)$limit, PDO::PARAM_INT);
                $stmt->bindValue($i++, (int)$offset, PDO::PARAM_INT);
                $stmt->execute();
                $filmes = $stmt->fetchAll();
                
                // Converter JSON de volta para array
                foreach ($filmes as &$filme) {
                    $filme['categoria'] = json_decode($filme['categoria'], true);
                    $filme['avaliacoes'] = $filme['avaliacoes'] ? json_decode($filme['avaliacoes'], true) : null;
                }
                
                $pages = (int)ceil($total / $limit);
                echo json_encode([
                    'success' => true,
                    'filmes' => $filmes,
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => $pages
                ]);
                break;
            }
            
            // Buscar filme por GUID
            if (preg_match('/^filmes\/([^\/]+)$/', $endpoint, $matches)) {
                $guid = $matches[1];
                $stmt = $pdo->prepare("SELECT * FROM filmes WHERE GUID = ?");
                $stmt->execute([$guid]);
                $filme = $stmt->fetch();
                
                if ($filme) {
                    $filme['categoria'] = json_decode($filme['categoria'], true);
                    $filme['avaliacoes'] = $filme['avaliacoes'] ? json_decode($filme['avaliacoes'], true) : null;
                    echo json_encode(['success' => true, 'filme' => $filme]);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Filme não encontrado']);
                }
                break;
            }

            // (removido) Criar slider estava erroneamente dentro do bloco GET
            
            // Rota padrão - listar filmes com paginação/busca/ordenação
            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));
            $q = trim($_GET['q'] ?? '');
            $sort = $_GET['sort'] ?? 'createdAt';
            $order = strtolower($_GET['order'] ?? 'desc');

            $allowedSort = ['createdAt', 'updatedAt', 'ano', 'nomePortugues', 'nomeOriginal'];
            if (!in_array($sort, $allowedSort, true)) { $sort = 'createdAt'; }
            $order = $order === 'asc' ? 'ASC' : 'DESC';

            $where = [];
            $params = [];
            if ($q !== '') {
                $where[] = '(nomePortugues LIKE ? OR nomeOriginal LIKE ?)';
                $like = '%' . $q . '%';
                $params[] = $like;
                $params[] = $like;
            }
            $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

            $stmtCount = $pdo->prepare("SELECT COUNT(*) as total FROM filmes $whereSql");
            $stmtCount->execute($params);
            $total = (int)$stmtCount->fetchColumn();

            $offset = ($page - 1) * $limit;
            $sql = "SELECT * FROM filmes $whereSql ORDER BY $sort $order LIMIT ? OFFSET ?";
            $stmt = $pdo->prepare($sql);
            $i = 1;
            foreach ($params as $p) { $stmt->bindValue($i++, $p, PDO::PARAM_STR); }
            $stmt->bindValue($i++, (int)$limit, PDO::PARAM_INT);
            $stmt->bindValue($i++, (int)$offset, PDO::PARAM_INT);
            $stmt->execute();
            $filmes = $stmt->fetchAll();
            
            foreach ($filmes as &$filme) {
                $filme['categoria'] = json_decode($filme['categoria'], true);
                $filme['avaliacoes'] = $filme['avaliacoes'] ? json_decode($filme['avaliacoes'], true) : null;
            }
            
            $pages = (int)ceil($total / $limit);
            echo json_encode([
                'success' => true,
                'filmes' => $filmes,
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => $pages
            ]);
            break;
            
        case 'PUT':
            // Logs iniciais para PUT
            $contentTypeHeader = $_SERVER['CONTENT_TYPE'] ?? ($_SERVER['HTTP_CONTENT_TYPE'] ?? '');
            fdb_log(['phase' => 'postput-enter', 'endpoint' => $endpoint, 'contentType' => $contentTypeHeader]);

            // Upload de vídeo para Bunny via proxy binário
            if (preg_match('/^bunny\\/videos\\/([A-Za-z0-9\-]+)$/', $endpoint, $m)) {
                $guid = $m[1];
                $key = fdb_get_bunny_key($pdo);
                if (!$key) {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'error' => 'Bunny API Key not found']);
                    break;
                }

                $base = 'https://video.bunnycdn.com/library';
                $url = rtrim($base, '/') . '/' . rawurlencode(BUNNY_LIBRARY_ID) . '/videos/' . rawurlencode($guid);

                $status = 0; $resp = null; $err = null;
                if (function_exists('curl_init')) {
                    $ch = curl_init($url);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
                    curl_setopt($ch, CURLOPT_HTTPHEADER, [
                        'AccessKey: ' . $key,
                        'Content-Type: application/octet-stream'
                    ]);
                    // Atenção: isto faz buffer em memória; avaliar streaming se necessário
                    $rawBody = file_get_contents('php://input');
                    curl_setopt($ch, CURLOPT_POSTFIELDS, $rawBody);
                    curl_setopt($ch, CURLOPT_TIMEOUT, 3600);
                    if (BUNNY_CURL_RELAX_SSL) {
                        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
                    } else {
                        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
                        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
                    }
                    $resp = curl_exec($ch);
                    $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
                    $err = curl_error($ch);
                    curl_close($ch);
                } else {
                    // Fallback com stream context (pode não suportar grandes uploads)
                    $rawBody = file_get_contents('php://input');
                    $opts = [
                        'http' => [
                            'method' => 'PUT',
                            'header' => "AccessKey: " . $key . "\r\nContent-Type: application/octet-stream\r\n",
                            'content' => $rawBody,
                            'ignore_errors' => true,
                            'timeout' => 3600,
                        ]
                    ];
                    $ctx = stream_context_create($opts);
                    $resp = @file_get_contents($url, false, $ctx);
                    if (isset($http_response_header[0]) && preg_match('#HTTP/\\d+\.\\d+\\s+(\\d{3})#', $http_response_header[0], $mm)) {
                        $status = (int)$mm[1];
                    }
                }

                fdb_log(['phase' => 'put-match', 'guid' => $guid, 'status' => $status, 'curl_error' => $err]);
                if ($status >= 200 && $status < 300) {
                    echo json_encode(['success' => true, 'videoGUID' => $guid, 'status' => $status]);
                } else {
                    http_response_code($status ?: 502);
                    echo json_encode(['success' => false, 'error' => 'Upload failed', 'status' => $status, 'raw' => $resp, 'curl_error' => $err]);
                }
                break;
            }

            // Para demais PUTs, interpretar JSON do corpo
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Sliders - atualizar
            if (preg_match('/^sliders\/([0-9]+)$/', $endpoint, $m)) {
                $id = (int)$m[1];
                if (!isset($input['slider']) || !is_array($input['slider'])) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Payload inválido: campo slider é obrigatório']);
                    break;
                }

                $slider = $input['slider'];
                $titulo = trim($slider['titulo'] ?? '');
                $tipo = $slider['tipo'] ?? 'categoria';
                $filtro = $slider['filtro'] ?? null;
                $filmesIds = isset($slider['filmesIds']) && is_array($slider['filmesIds']) ? $slider['filmesIds'] : [];
                $ativo = isset($slider['ativo']) ? (int)$slider['ativo'] : 1;

                if ($titulo === '' || !in_array($tipo, ['categoria','decada','personalizado'], true)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Campos inválidos para slider']);
                    break;
                }

                $stmt = $pdo->prepare("UPDATE sliders SET titulo = ?, tipo = ?, filtro = ?, filmesIds = ?, ativo = ?, updatedAt = NOW() WHERE id = ?");
                $stmt->execute([$titulo, $tipo, $filtro, json_encode($filmesIds), $ativo, $id]);

                echo json_encode(['success' => true]);
                break;
            }
            
            // Atualizar filme
            if ($action === 'update' && isset($_GET['guid'])) {
                $guid = $_GET['guid'];
                
                $stmt = $pdo->prepare("
                    UPDATE filmes SET 
                        nomeOriginal = ?, nomePortugues = ?, ano = ?, categoria = ?, 
                        duracao = ?, sinopse = ?, embedLink = ?, imagemUrl = ?, 
                        videoGUID = ?, videoStatus = ?
                    WHERE GUID = ?
                ");
                
                $stmt->execute([
                    $input['nomeOriginal'],
                    $input['nomePortugues'],
                    $input['ano'],
                    json_encode($input['categoria']),
                    $input['duracao'],
                    $input['sinopse'],
                    $input['embedLink'] ?? null,
                    $input['imagemUrl'] ?? null,
                    $input['videoGUID'] ?? null,
                    $input['videoStatus'] ?? 'pending',
                    $guid
                ]);
                
                echo json_encode(['success' => true]);
                break;
            }
            
            // Atualizar filme por endpoint
            if (preg_match('/^filmes\/([^\/]+)$/', $endpoint, $matches)) {
                $guid = $matches[1];
                
                $stmt = $pdo->prepare("
                    UPDATE filmes SET 
                        nomeOriginal = ?, nomePortugues = ?, ano = ?, categoria = ?, 
                        duracao = ?, sinopse = ?, embedLink = ?, imagemUrl = ?, 
                        videoGUID = ?, videoStatus = ?
                    WHERE GUID = ?
                ");
                
                $stmt->execute([
                    $input['nomeOriginal'],
                    $input['nomePortugues'],
                    $input['ano'],
                    json_encode($input['categoria']),
                    $input['duracao'],
                    $input['sinopse'],
                    $input['embedLink'] ?? null,
                    $input['imagemUrl'] ?? null,
                    $input['videoGUID'] ?? null,
                    $input['videoStatus'] ?? 'pending',
                    $guid
                ]);
                
                echo json_encode(['success' => true]);
                break;
            }
            
            // Log de 404 para diagnóstico
            fdb_log([
                'phase' => '404',
                'method' => $method,
                'endpoint' => $endpoint,
                'queryEndpoint' => ($_GET['endpoint'] ?? ''),
                'xEndpoint' => ($_SERVER['HTTP_X_ENDPOINT'] ?? ''),
                'contentType' => ($_SERVER['CONTENT_TYPE'] ?? ($_SERVER['HTTP_CONTENT_TYPE'] ?? '')),
                'rawUri' => ($rawUri ?? ''),
            ]);
            http_response_code(404);
            echo json_encode([
                'error' => 'Endpoint não encontrado',
                'details' => [
                    'method' => $method,
                    'endpoint' => $endpoint,
                    'queryEndpoint' => ($_GET['endpoint'] ?? ''),
                    'xEndpoint' => ($_SERVER['HTTP_X_ENDPOINT'] ?? ''),
                    'contentType' => ($_SERVER['CONTENT_TYPE'] ?? ($_SERVER['HTTP_CONTENT_TYPE'] ?? '')),
                    'rawUri' => ($rawUri ?? ''),
                ]
            ]);
            break;
            
        case 'DELETE':
            // Bunny - deletar vídeo por GUID
            if (preg_match('/^bunny\\/videos\\/([A-Za-z0-9\-]+)$/', $endpoint, $m)) {
                $guid = $m[1];
                $key = fdb_get_bunny_key($pdo);
                if (!$key) {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'error' => 'Bunny API Key not found']);
                    break;
                }
                $r = fdb_bunny_request('DELETE', 'videos/' . $guid, $key, null);
                if ($r['status'] >= 200 && $r['status'] < 300) {
                    echo json_encode(['success' => true]);
                    break;
                }
                http_response_code($r['status'] ?: 502);
                echo json_encode(['success' => false, 'error' => 'Bunny delete failed', 'details' => $r['body'] ?: $r['raw'], 'curl_error' => ($r['curl_error'] ?? null)]);
                break;
            }
            // Deletar filme
            if ($action === 'delete' && isset($_GET['guid'])) {
                $guid = $_GET['guid'];
                
                $stmt = $pdo->prepare("DELETE FROM filmes WHERE GUID = ?");
                $stmt->execute([$guid]);
                
                echo json_encode(['success' => true]);
                break;
            }
            
            // Deletar filme por endpoint
            if (preg_match('/^filmes\/([^\/]+)$/', $endpoint, $matches)) {
                $guid = $matches[1];
                
                $stmt = $pdo->prepare("DELETE FROM filmes WHERE GUID = ?");
                $stmt->execute([$guid]);
                
                echo json_encode(['success' => true]);
                break;
            }
            
            // Deletar slider
            if (preg_match('/^sliders\/([0-9]+)$/', $endpoint, $matches)) {
                $id = (int)$matches[1];
                
                $stmt = $pdo->prepare("DELETE FROM sliders WHERE id = ?");
                $stmt->execute([$id]);
                
                echo json_encode(['success' => true]);
                break;
            }
            
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint não encontrado']);
            break;
            
        case 'POST':
        case 'PUT':
            // Ler JSON somente quando apropriado, para não consumir corpo binário de upload
            $contentTypeHeader = $_SERVER['CONTENT_TYPE'] ?? ($_SERVER['HTTP_CONTENT_TYPE'] ?? '');
            $isJson = stripos($contentTypeHeader, 'application/json') !== false;
            $input = $isJson ? (json_decode(file_get_contents('php://input'), true) ?: []) : [];
            // Diagnóstico: log de entrada no case POST/PUT
            fdb_log(['phase' => 'postput-enter', 'method' => $method, 'endpoint' => $endpoint, 'isJson' => $isJson, 'contentType' => $contentTypeHeader]);
            
            // Bunny - upload de arquivo via proxy seguro (PUT binário)
            // Torna a checagem mais permissiva: aceita qualquer endpoint que inicie com 'bunny/videos/'
            if ($method === 'PUT' && !$isJson && (strpos($endpoint, 'bunny/videos/') === 0)) {
                $guid = basename($endpoint);
                if (!preg_match('/^[A-Za-z0-9\-]{8,}$/', $guid)) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => 'Invalid GUID format', 'endpoint' => $endpoint, 'guid' => $guid]);
                    break;
                }
                fdb_log(['phase' => 'put-match', 'guid' => $guid, 'endpoint' => $endpoint]);
                $key = fdb_get_bunny_key($pdo);
                if (!$key) {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'error' => 'Bunny API Key not found']);
                    break;
                }
                // Repassar o corpo binário e Content-Type
                $binary = file_get_contents('php://input');
                $ct = $contentTypeHeader ?: 'application/octet-stream';
                $base = 'https://video.bunnycdn.com/library';
                $url = rtrim($base, '/') . '/' . rawurlencode(BUNNY_LIBRARY_ID) . '/videos/' . rawurlencode($guid);
                $headers = [
                    'AccessKey: ' . $key,
                    'Content-Type: ' . $ct,
                    'Accept: application/json',
                ];
                if (function_exists('curl_init')) {
                    $ch = curl_init($url);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
                    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
                    curl_setopt($ch, CURLOPT_POSTFIELDS, $binary);
                    curl_setopt($ch, CURLOPT_TIMEOUT, 0); // upload pode demorar
                    if (BUNNY_CURL_RELAX_SSL) {
                        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
                    } else {
                        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
                        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
                    }
                    $resp = curl_exec($ch);
                    $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
                    $err = curl_error($ch);
                    curl_close($ch);
                    http_response_code($status ?: 200);
                    if ($status >= 200 && $status < 300) {
                        echo json_encode(['success' => true]);
                    } else {
                        echo json_encode(['success' => false, 'error' => 'Bunny upload failed', 'curl_error' => $err, 'details' => $resp]);
                    }
                } else {
                    $opts = [
                        'http' => [
                            'method' => 'PUT',
                            'header' => implode("\r\n", $headers) . "\r\n",
                            'content' => $binary,
                            'ignore_errors' => true,
                        ]
                    ];
                    $ctx = stream_context_create($opts);
                    $resp = @file_get_contents($url, false, $ctx);
                    $status = 0;
                    if (isset($http_response_header[0]) && preg_match('#HTTP/\\d+\.\\d+\\s+(\\d{3})#', $http_response_header[0], $mm)) {
                        $status = (int)$mm[1];
                    }
                    http_response_code($status ?: 200);
                    if ($status >= 200 && $status < 300) {
                        echo json_encode(['success' => true]);
                    } else {
                        echo json_encode(['success' => false, 'error' => 'Bunny upload failed', 'details' => $resp]);
                    }
                }
                break;
            }
            
            // Bunny - criar/registrar vídeo
            if ($method === 'POST' && $endpoint === 'bunny/videos') {
                $key = fdb_get_bunny_key($pdo);
                if (!$key) {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'error' => 'Bunny API Key not found']);
                    break;
                }
                $action = $input['action'] ?? 'create';
                if ($action === 'register') {
                    $guid = trim((string)($input['videoGUID'] ?? ''));
                    if (!$guid) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => 'videoGUID required for register']);
                        break;
                    }
                    echo json_encode(['success' => true, 'videoGUID' => $guid, 'embedLink' => fdb_embed_iframe($guid)]);
                    break;
                }
                // create
                $fileName = trim((string)($input['fileName'] ?? 'video.mp4'));
                $r = fdb_bunny_request('POST', 'videos', $key, ['title' => $fileName ?: 'video.mp4']);
                if ($r['status'] >= 200 && $r['status'] < 300 && isset($r['body']['guid'])) {
                    $guid = $r['body']['guid'];
                    echo json_encode([
                        'success' => true,
                        'videoGUID' => $guid,
                        'embedLink' => fdb_embed_iframe($guid),
                        'bunny' => $r['body']
                    ]);
                    break;
                }
                http_response_code($r['status'] ?: 502);
                echo json_encode(['success' => false, 'error' => 'Bunny create failed', 'details' => $r['body'] ?: $r['raw'], 'curl_error' => ($r['curl_error'] ?? null)]);
                break;
            }
            
            // Autenticação
            if ($endpoint === 'auth/login') {
                $user = login($pdo, $input['email'], $input['senha']);
                if ($user) {
                    echo json_encode(['success' => true, 'user' => $user]);
                } else {
                    http_response_code(401);
                    echo json_encode(['error' => 'Email ou senha incorretos']);
                }
                break;
            }
            
            if ($endpoint === 'auth/register') {
                $result = register($pdo, $input['nome'], $input['email'], $input['senha']);
                if (isset($result['error'])) {
                    http_response_code(400);
                    echo json_encode($result);
                } else {
                    echo json_encode(['success' => true, 'user' => $result]);
                }
                break;
            }
            
            if ($endpoint === 'auth/logout') {
                session_start();
                session_destroy();
                echo json_encode(['success' => true]);
                break;
            }
            
            // Solicitar redefinição de senha
            if ($endpoint === 'auth/forgot-password') {
                $email = $input['email'] ?? '';
                
                if (empty($email)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Email é obrigatório']);
                    break;
                }
                
                // Verificar se o email existe
                $stmt = $pdo->prepare("SELECT id, nome FROM usuarios WHERE email = ?");
                $stmt->execute([$email]);
                $user = $stmt->fetch();
                
                if (!$user) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Email não encontrado']);
                    break;
                }
                
                // Gerar token único para redefinição (válido por 1 hora)
                $token = bin2hex(random_bytes(32));
                $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));
                
                // Salvar token na base de dados
                $stmt = $pdo->prepare("
                    INSERT INTO password_resets (email, token, expires_at) 
                    VALUES (?, ?, ?) 
                    ON DUPLICATE KEY UPDATE token = ?, expires_at = ?
                ");
                $stmt->execute([$email, $token, $expires, $token, $expires]);
                
                // Em produção, aqui enviaria um email com o link
                // Por enquanto, retornamos o token para teste
                echo json_encode([
                    'success' => true, 
                    'message' => 'Link de redefinição enviado para seu email',
                    'token' => $token, // Remover em produção
                    'reset_url' => "https://www.fundodobaufilmes.com/reset-password?token=" . $token
                ]);
                break;
            }
            
            // Redefinir senha com token
            if ($endpoint === 'auth/reset-password') {
                $token = $input['token'] ?? '';
                $novaSenha = $input['novaSenha'] ?? '';
                
                if (empty($token) || empty($novaSenha)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Token e nova senha são obrigatórios']);
                    break;
                }
                
                // Verificar se o token é válido e não expirou
                $stmt = $pdo->prepare("
                    SELECT email FROM password_resets 
                    WHERE token = ? AND expires_at > NOW() AND usado = 0
                ");
                $stmt->execute([$token]);
                $reset = $stmt->fetch();
                
                if (!$reset) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Token inválido ou expirado']);
                    break;
                }
                
                // Atualizar senha do usuário
                $senhaHash = password_hash($novaSenha, PASSWORD_DEFAULT);
                $stmt = $pdo->prepare("UPDATE usuarios SET senha = ? WHERE email = ?");
                
                if ($stmt->execute([$senhaHash, $reset['email']])) {
                    // Marcar token como usado
                    $stmt = $pdo->prepare("UPDATE password_resets SET usado = 1 WHERE token = ?");
                    $stmt->execute([$token]);
                    
                    echo json_encode(['success' => true, 'message' => 'Senha alterada com sucesso']);
                } else {
                    http_response_code(500);
                    echo json_encode(['error' => 'Erro ao alterar senha']);
                }
                break;
            }
            
            // Verificar status de autenticação
            if ($endpoint === 'auth/me') {
                $user = getCurrentUser($pdo);
                if ($user) {
                    echo json_encode(['success' => true, 'user' => $user]);
                } else {
                    http_response_code(401);
                    echo json_encode(['error' => 'Usuário não autenticado']);
                }
                break;
            }

            // Sliders - criar (POST /sliders)
            if ($endpoint === 'sliders' && $method === 'POST') {
                if (!isset($input['slider']) || !is_array($input['slider'])) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Payload inválido: campo slider é obrigatório']);
                    break;
                }

                $slider = $input['slider'];

                // Garantir tabela e esquema compatível
                ensureSlidersTable($pdo);

                $titulo = trim($slider['titulo'] ?? '');
                $tipo = $slider['tipo'] ?? 'categoria';
                $filtro = $slider['filtro'] ?? null;
                $filmesIds = isset($slider['filmesIds']) && is_array($slider['filmesIds']) ? $slider['filmesIds'] : [];
                $ativo = isset($slider['ativo']) ? (int)$slider['ativo'] : 1;

                if ($titulo === '' || !in_array($tipo, ['categoria','decada','personalizado'], true)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Campos inválidos para slider']);
                    break;
                }

                try {
                    $stmt = $pdo->prepare("INSERT INTO sliders (titulo, tipo, filtro, filmesIds, ativo, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())");
                    $stmt->execute([$titulo, $tipo, $filtro, json_encode($filmesIds), $ativo]);
                } catch (Throwable $e) {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'error' => 'Falha ao salvar slider', 'detail' => $e->getMessage()]);
                    break;
                }

                $id = (int)$pdo->lastInsertId();
                $stmt = $pdo->prepare("SELECT id, titulo, tipo, filtro, filmesIds, ativo, createdAt, updatedAt FROM sliders WHERE id = ?");
                $stmt->execute([$id]);
                $novo = $stmt->fetch();
                if ($novo) { $novo['filmesIds'] = $novo['filmesIds'] ? json_decode($novo['filmesIds'], true) : []; }

                http_response_code(200);
                echo json_encode(['success' => true, 'slider' => $novo]);
                exit;
            }

            // Upload de imagem do carrossel (multipart form-data)
            if ($endpoint === 'salvar-imagem-carrossel' && isset($_FILES) && isset($_FILES['imagem'])) {
                try {
                    // Tentar detectar/garantir pasta existente
                    $candidates = [
                        ['fs' => __DIR__ . '/images/carrossel/',           'public' => '/images/carrossel/'],
                        ['fs' => __DIR__ . '/../public/images/carrossel/', 'public' => '/images/carrossel/'],
                        ['fs' => __DIR__ . '/../images/carrossel/',        'public' => '/images/carrossel/'],
                    ];
                    $chosen = null;
                    foreach ($candidates as $cand) { if (is_dir($cand['fs'])) { $chosen = $cand; break; } }
                    if ($chosen === null) { $chosen = $candidates[0]; @mkdir($chosen['fs'], 0775, true); }
                    $uploadDir = $chosen['fs'];
                    $publicBase = $chosen['public'];

                    $file = $_FILES['imagem'];
                    if ($file['error'] !== UPLOAD_ERR_OK) {
                        http_response_code(400);
                        echo json_encode(['error' => 'Falha no upload da imagem']);
                        break;
                    }

                    $posicao = isset($_POST['posicao']) ? (int)$_POST['posicao'] : 0;
                    $nomeFilme = $_POST['nomeFilme'] ?? 'filme';
                    $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $nomeFilme));
                    $slug = trim($slug, '-');

                    $ext = pathinfo($file['name'] ?? '', PATHINFO_EXTENSION) ?: 'jpg';
                    $basename = "carrossel-{$posicao}-{$slug}.{$ext}";
                    $destPath = $uploadDir . $basename;
                    if (!move_uploaded_file($file['tmp_name'], $destPath)) {
                        http_response_code(500);
                        echo json_encode(['error' => 'Não foi possível salvar a imagem']);
                        break;
                    }

                    $publicPath = rtrim($publicBase, '/') . '/' . $basename;
                    http_response_code(200);
                    echo json_encode(['success' => true, 'caminho' => $publicPath]);
                    exit;
                } catch (Exception $e) {
                    http_response_code(500);
                    echo json_encode(['error' => 'Erro no upload do carrossel: ' . $e->getMessage()]);
                }
                break;
            }

            // Upload de imagem do filme (poster) - aceita multipart (imagem|image|file) ou base64 (imagemBase64)
            if ($endpoint === 'salvar-imagem-filme') {
                try {
                    $candidates = [
                        ['fs' => __DIR__ . '/images/filmes/',            'public' => '/images/filmes/'],
                        ['fs' => __DIR__ . '/../public/images/filmes/',  'public' => '/images/filmes/'],
                        ['fs' => __DIR__ . '/../images/filmes/',         'public' => '/images/filmes/'],
                    ];
                    $chosen = null;
                    foreach ($candidates as $cand) { if (is_dir($cand['fs'])) { $chosen = $cand; break; } }
                    if ($chosen === null) { $chosen = $candidates[0]; @mkdir($chosen['fs'], 0775, true); }
                    $uploadDir = $chosen['fs'];
                    $publicBase = $chosen['public'];

                    // Priorizar slug explícito (POST ou JSON), senão derivar de nomeFilme
                    $slugParam = $_POST['slug'] ?? ($input['slug'] ?? null);
                    if ($slugParam) {
                        $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', (string)$slugParam));
                        $slug = trim($slug, '-');
                    } else {
                        $nomeFilme = $_POST['nomeFilme'] ?? ($input['nomeFilme'] ?? 'filme');
                        $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', (string)$nomeFilme));
                        $slug = trim($slug, '-');
                    }

                    $savedPublicPath = null;

                    // multipart
                    $file = null;
                    if (!empty($_FILES)) {
                        if (isset($_FILES['imagem'])) { $file = $_FILES['imagem']; }
                        elseif (isset($_FILES['image'])) { $file = $_FILES['image']; }
                        elseif (isset($_FILES['file'])) { $file = $_FILES['file']; }
                    }
                    if ($file && isset($file['tmp_name'])) {
                        if ($file['error'] !== UPLOAD_ERR_OK) {
                            http_response_code(400);
                            echo json_encode(['success' => false, 'error' => 'Falha no upload da imagem (multipart)']);
                            break;
                        }
                        $ext = pathinfo($file['name'] ?? '', PATHINFO_EXTENSION) ?: 'jpg';
                        $basename = "poster-{$slug}.{$ext}";
                        $destPath = $uploadDir . $basename;
                        if (!move_uploaded_file($file['tmp_name'], $destPath)) {
                            http_response_code(500);
                            echo json_encode(['success' => false, 'error' => 'Não foi possível salvar a imagem (move_uploaded_file)']);
                            break;
                        }
                        $savedPublicPath = rtrim($publicBase, '/') . '/' . $basename;
                    } else {
                        // base64
                        $base64 = $_POST['imagemBase64'] ?? ($input['imagemBase64'] ?? null);
                        if ($base64 && preg_match('/^data:(.*?);base64,(.*)$/', $base64, $m)) {
                            $mime = $m[1];
                            $data = base64_decode($m[2]);
                            if ($data === false) {
                                http_response_code(400);
                                echo json_encode(['success' => false, 'error' => 'Base64 inválido']);
                                break;
                            }
                            $ext = 'jpg';
                            if (stripos($mime, 'png') !== false) { $ext = 'png'; }
                            elseif (stripos($mime, 'webp') !== false) { $ext = 'webp'; }
                            $basename = "poster-{$slug}.{$ext}";
                            $destPath = $uploadDir . $basename;
                            if (@file_put_contents($destPath, $data) === false) {
                                http_response_code(500);
                                echo json_encode(['success' => false, 'error' => 'Não foi possível salvar a imagem (base64)']);
                                break;
                            }
                            $savedPublicPath = rtrim($publicBase, '/') . '/' . $basename;
                        } else {
                            http_response_code(400);
                            echo json_encode(['success' => false, 'error' => 'Nenhum arquivo enviado (imagem/image/file ou imagemBase64)']);
                            break;
                        }
                    }

                    // Montar URL absoluta, se possível
                    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
                    $host = $_SERVER['HTTP_HOST'] ?? '';
                    $absoluteUrl = $host ? ($scheme . '://' . $host . $savedPublicPath) : $savedPublicPath;

                    http_response_code(200);
                    echo json_encode(['success' => true, 'caminho' => $savedPublicPath, 'url' => $absoluteUrl]);
                    exit;
                } catch (Exception $e) {
                    http_response_code(500);
                    echo json_encode(['error' => 'Erro no upload: ' . $e->getMessage()]);
                }
                break;
            }

            // Salvar configuração do carrossel (array de itens)
            if ($endpoint === 'carrossel' && $method === 'POST') {
                if (!isset($input['carrossel']) || !is_array($input['carrossel'])) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Payload inválido: campo carrossel é obrigatório']);
                    break;
                }
                try {
                    $pdo->beginTransaction();
                    $pdo->exec('DELETE FROM carrossel');
                    $stmt = $pdo->prepare("INSERT INTO carrossel (posicao, filmeId, imagemUrl, ativo, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())");
                    foreach ($input['carrossel'] as $item) {
                        $posicao = (int)($item['posicao'] ?? 0);
                        $filmeId = $item['filmeId'] ?? ($item['filme_guid'] ?? null);
                        $imagemUrl = $item['imagemUrl'] ?? null;
                        $ativo = isset($item['ativo']) ? (int)$item['ativo'] : 1;
                        if ($filmeId && $imagemUrl) { $stmt->execute([$posicao, $filmeId, $imagemUrl, $ativo]); }
                    }
                    $pdo->commit();
                    http_response_code(200);
                    echo json_encode(['success' => true]);
                    exit;
                } catch (Exception $e) {
                    $pdo->rollBack();
                    http_response_code(500);
                    echo json_encode(['error' => 'Erro ao salvar carrossel: ' . $e->getMessage()]);
                }
                break;
            }
            
            // Estatísticas de usuários
            if ($endpoint === 'stats/usuarios') {
                try {
                    // Contar total de usuários
                    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM usuarios WHERE ativo = 1");
                    $stmt->execute();
                    $totalUsuarios = $stmt->fetch()['total'];

                    // Contar avaliações recentes (últimos 7 dias) - com fallback se tabela não existir
                    $novasAvaliacoes = 0;
                    try {
                        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM avaliacoes_usuarios WHERE data_criacao >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
                        $stmt->execute();
                        $novasAvaliacoes = $stmt->fetch()['total'];
                    } catch (Exception $e) {
                        // Tabela não existe, usar 0
                        $novasAvaliacoes = 0;
                    }

                    echo json_encode([
                        'success' => true,
                        'totalUsuarios' => $totalUsuarios,
                        'novasAvaliacoes' => $novasAvaliacoes
                    ]);
                } catch (Exception $e) {
                    http_response_code(500);
                    echo json_encode(['error' => 'Erro ao buscar estatísticas: ' . $e->getMessage()]);
                }
                break;
            }

            // Atualizar perfil do usuário (PUT)
            if ($endpoint === 'auth/profile' && $method === 'PUT') {
                $user = getCurrentUser($pdo);
                if (!$user) {
                    http_response_code(401);
                    echo json_encode(['error' => 'Usuário não autenticado']);
                    break;
                }
                
                $allowedFields = ['nome', 'avatar'];
                $updates = [];
                $values = [];
                
                foreach ($allowedFields as $field) {
                    if (isset($input[$field])) {
                        $updates[] = "$field = ?";
                        $values[] = $input[$field];
                    }
                }
                
                if (empty($updates)) {
                    echo json_encode(['success' => true, 'user' => $user]);
                    break;
                }
                
                $values[] = $user['id'];
                $sql = "UPDATE usuarios SET " . implode(', ', $updates) . " WHERE id = ?";
                $stmt = $pdo->prepare($sql);
                
                if ($stmt->execute($values)) {
                    // Buscar usuário atualizado
                    $stmt = $pdo->prepare("SELECT id, nome, email, tipo, avatar FROM usuarios WHERE id = ?");
                    $stmt->execute([$user['id']]);
                    $updatedUser = $stmt->fetch();
                    
                    echo json_encode(['success' => true, 'user' => $updatedUser]);
                } else {
                    http_response_code(500);
                    echo json_encode(['error' => 'Erro ao atualizar perfil']);
                }
                break;
            }
            

            
            // Criar tabela (apenas para desenvolvimento)
            if ($action === 'create_table') {
                $sql = "
                CREATE TABLE IF NOT EXISTS filmes (
                    GUID VARCHAR(36) PRIMARY KEY,
                    nomeOriginal VARCHAR(255) NOT NULL,
                    nomePortugues VARCHAR(255) NOT NULL,
                    ano VARCHAR(4) NOT NULL,
                    categoria JSON NOT NULL,
                    duracao VARCHAR(10) NOT NULL,
                    sinopse TEXT,
                    embedLink TEXT,
                    imagemUrl VARCHAR(500),
                    assistencias INT DEFAULT 0,
                    avaliacoes JSON,
                    videoGUID VARCHAR(100),
                    videoStatus VARCHAR(50) DEFAULT 'pending',
                    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )";
                
                $pdo->exec($sql);
                echo json_encode(['success' => true, 'message' => 'Tabela filmes criada com sucesso']);
                break;
            }
            
            // CRUD de filmes
            if ($endpoint === 'filmes' || $action === 'create') {
                // Remover verificação de admin temporariamente para desenvolvimento
                // $user = getCurrentUser($pdo);
                // if (!$user || $user['tipo'] !== 'admin') {
                //     http_response_code(403);
                //     echo json_encode(['error' => 'Acesso negado']);
                //     break;
                // }
                
                $guid = generateGUID();
                $stmt = $pdo->prepare("
                    INSERT INTO filmes (GUID, nomeOriginal, nomePortugues, ano, categoria, duracao, sinopse, embedLink, imagemUrl, videoGUID, videoStatus)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                
                $stmt->execute([
                    $guid,
                    $input['nomeOriginal'],
                    $input['nomePortugues'],
                    $input['ano'],
                    json_encode($input['categoria']),
                    $input['duracao'],
                    $input['sinopse'],
                    $input['embedLink'] ?? null,
                    $input['imagemUrl'] ?? null,
                    $input['videoGUID'] ?? null,
                    $input['videoStatus'] ?? 'pending'
                ]);
                
                echo json_encode(['success' => true, 'guid' => $guid]);
                break;
            }
            
            // Adicionar filme assistido
            if (preg_match('/^filmes\/([^\/]+)\/assistir$/', $endpoint, $matches)) {
                $user = getCurrentUser($pdo);
                if (!$user) {
                    http_response_code(401);
                    echo json_encode(['error' => 'Usuário não autenticado']);
                    break;
                }
                
                $filmeGuid = $matches[1];
                
                // Verificar se filme existe
                $stmt = $pdo->prepare("SELECT GUID FROM filmes WHERE GUID = ?");
                $stmt->execute([$filmeGuid]);
                if (!$stmt->fetch()) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Filme não encontrado']);
                    break;
                }
                
                // Adicionar à lista de assistidos
                $stmt = $pdo->prepare("INSERT IGNORE INTO filmes_assistidos (usuario_id, filme_guid) VALUES (?, ?)");
                $stmt->execute([$user['id'], $filmeGuid]);
                
                // Remover da lista "para assistir" se existir
                $stmt = $pdo->prepare("DELETE FROM filmes_para_assistir WHERE usuario_id = ? AND filme_guid = ?");
                $stmt->execute([$user['id'], $filmeGuid]);
                
                // Incrementar contador
                $stmt = $pdo->prepare("UPDATE filmes SET assistencias = assistencias + 1 WHERE GUID = ?");
                $stmt->execute([$filmeGuid]);
                
                echo json_encode(['success' => true]);
                break;
            }
            
            // Adicionar filme para assistir
            if (preg_match('/^filmes\/([^\/]+)\/para-assistir$/', $endpoint, $matches)) {
                $user = getCurrentUser($pdo);
                if (!$user) {
                    http_response_code(401);
                    echo json_encode(['error' => 'Usuário não autenticado']);
                    break;
                }
                
                $filmeGuid = $matches[1];
                
                $stmt = $pdo->prepare("INSERT IGNORE INTO filmes_para_assistir (usuario_id, filme_guid) VALUES (?, ?)");
                $stmt->execute([$user['id'], $filmeGuid]);
                
                echo json_encode(['success' => true]);
                break;
            }
            
            // Avaliar filme
            if (preg_match('/^filmes\/([^\/]+)\/avaliar$/', $endpoint, $matches)) {
                $user = getCurrentUser($pdo);
                if (!$user) {
                    http_response_code(401);
                    echo json_encode(['error' => 'Usuário não autenticado']);
                    break;
                }
                
                $filmeGuid = $matches[1];
                $avaliacao = $input['avaliacao'];
                
                if (!in_array($avaliacao, ['gostei', 'gostei-muito', 'nao-gostei'])) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Avaliação inválida']);
                    break;
                }
                
                $stmt = $pdo->prepare("
                    INSERT INTO avaliacoes (usuario_id, filme_guid, avaliacao) 
                    VALUES (?, ?, ?) 
                    ON DUPLICATE KEY UPDATE avaliacao = ?
                ");
                $stmt->execute([$user['id'], $filmeGuid, $avaliacao, $avaliacao]);
                
                echo json_encode(['success' => true]);
                break;
            }
            
            break;
            
        case 'GET':
            // Listar filmes
            if ($endpoint === 'filmes') {
                $user = getCurrentUser($pdo);
                
                $sql = "
                    SELECT 
                        f.*,
                        CASE WHEN fa.usuario_id IS NOT NULL THEN 1 ELSE 0 END as assistido,
                        CASE WHEN fpa.usuario_id IS NOT NULL THEN 1 ELSE 0 END as para_assistir,
                        av.avaliacao
                    FROM filmes f
                ";
                
                if ($user) {
                    $sql .= "
                        LEFT JOIN filmes_assistidos fa ON f.GUID = fa.filme_guid AND fa.usuario_id = ?
                        LEFT JOIN filmes_para_assistir fpa ON f.GUID = fpa.filme_guid AND fpa.usuario_id = ?
                        LEFT JOIN avaliacoes av ON f.GUID = av.filme_guid AND av.usuario_id = ?
                    ";
                }
                
                $sql .= " ORDER BY f.nomePortugues";
                
                $stmt = $pdo->prepare($sql);
                
                if ($user) {
                    $stmt->execute([$user['id'], $user['id'], $user['id']]);
                } else {
                    $stmt->execute();
                }
                
                $filmes = $stmt->fetchAll();
                
                // Converter JSON strings para arrays
                foreach ($filmes as &$filme) {
                    $filme['categoria'] = json_decode($filme['categoria'], true);
                    if ($filme['avaliacoes']) {
                        $filme['avaliacoes'] = json_decode($filme['avaliacoes'], true);
                    }
                }
                
                echo json_encode($filmes);
                break;
            }
            
            // Buscar filme por GUID
            if (preg_match('/^filmes\/([^\/]+)$/', $endpoint, $matches)) {
                $user = getCurrentUser($pdo);
                $filmeGuid = $matches[1];
                
                $sql = "
                    SELECT 
                        f.*,
                        CASE WHEN fa.usuario_id IS NOT NULL THEN 1 ELSE 0 END as assistido,
                        CASE WHEN fpa.usuario_id IS NOT NULL THEN 1 ELSE 0 END as para_assistir,
                        av.avaliacao
                    FROM filmes f
                ";
                
                if ($user) {
                    $sql .= "
                        LEFT JOIN filmes_assistidos fa ON f.GUID = fa.filme_guid AND fa.usuario_id = ?
                        LEFT JOIN filmes_para_assistir fpa ON f.GUID = fpa.filme_guid AND fpa.usuario_id = ?
                        LEFT JOIN avaliacoes av ON f.GUID = av.filme_guid AND av.usuario_id = ?
                    ";
                }
                
                $sql .= " WHERE f.GUID = ?";
                
                $stmt = $pdo->prepare($sql);
                
                if ($user) {
                    $stmt->execute([$user['id'], $user['id'], $user['id'], $filmeGuid]);
                } else {
                    $stmt->execute([$filmeGuid]);
                }
                
                $filme = $stmt->fetch();
                
                if (!$filme) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Filme não encontrado']);
                    break;
                }
                
                $filme['categoria'] = json_decode($filme['categoria'], true);
                if ($filme['avaliacoes']) {
                    $filme['avaliacoes'] = json_decode($filme['avaliacoes'], true);
                }
                
                echo json_encode($filme);
                break;
            }
            
            // Buscar filmes por categoria
            if (preg_match('/^filmes\/categoria\/(.+)$/', $endpoint, $matches)) {
                $user = getCurrentUser($pdo);
                $categoria = urldecode($matches[1]);
                
                $sql = "
                    SELECT 
                        f.*,
                        CASE WHEN fa.usuario_id IS NOT NULL THEN 1 ELSE 0 END as assistido,
                        CASE WHEN fpa.usuario_id IS NOT NULL THEN 1 ELSE 0 END as para_assistir,
                        av.avaliacao
                    FROM filmes f
                ";
                
                if ($user) {
                    $sql .= "
                        LEFT JOIN filmes_assistidos fa ON f.GUID = fa.filme_guid AND fa.usuario_id = ?
                        LEFT JOIN filmes_para_assistir fpa ON f.GUID = fpa.filme_guid AND fpa.usuario_id = ?
                        LEFT JOIN avaliacoes av ON f.GUID = av.filme_guid AND av.usuario_id = ?
                    ";
                }
                
                $sql .= " WHERE JSON_CONTAINS(f.categoria, ?) ORDER BY f.nomePortugues";
                
                $stmt = $pdo->prepare($sql);
                
                if ($user) {
                    $stmt->execute([$user['id'], $user['id'], $user['id'], json_encode($categoria)]);
                } else {
                    $stmt->execute([json_encode($categoria)]);
                }
                
                $filmes = $stmt->fetchAll();
                
                foreach ($filmes as &$filme) {
                    $filme['categoria'] = json_decode($filme['categoria'], true);
                    if ($filme['avaliacoes']) {
                        $filme['avaliacoes'] = json_decode($filme['avaliacoes'], true);
                    }
                }
                
                echo json_encode($filmes);
                break;
            }
            
            // Buscar filmes
            if ($endpoint === 'filmes/buscar') {
                $user = getCurrentUser($pdo);
                $query = $_GET['q'] ?? '';
                
                if (empty($query)) {
                    echo json_encode([]);
                    break;
                }
                
                $sql = "
                    SELECT 
                        f.*,
                        CASE WHEN fa.usuario_id IS NOT NULL THEN 1 ELSE 0 END as assistido,
                        CASE WHEN fpa.usuario_id IS NOT NULL THEN 1 ELSE 0 END as para_assistir,
                        av.avaliacao
                    FROM filmes f
                ";
                
                if ($user) {
                    $sql .= "
                        LEFT JOIN filmes_assistidos fa ON f.GUID = fa.filme_guid AND fa.usuario_id = ?
                        LEFT JOIN filmes_para_assistir fpa ON f.GUID = fpa.filme_guid AND fpa.usuario_id = ?
                        LEFT JOIN avaliacoes av ON f.GUID = av.filme_guid AND av.usuario_id = ?
                    ";
                }
                
                $sql .= " WHERE MATCH(f.nomeOriginal, f.nomePortugues, f.sinopse) AGAINST(? IN BOOLEAN MODE) ORDER BY f.nomePortugues";
                
                $stmt = $pdo->prepare($sql);
                
                if ($user) {
                    $stmt->execute([$user['id'], $user['id'], $user['id'], $query]);
                } else {
                    $stmt->execute([$query]);
                }
                
                $filmes = $stmt->fetchAll();
                
                foreach ($filmes as &$filme) {
                    $filme['categoria'] = json_decode($filme['categoria'], true);
                    if ($filme['avaliacoes']) {
                        $filme['avaliacoes'] = json_decode($filme['avaliacoes'], true);
                    }
                }
                
                echo json_encode($filmes);
                break;
            }
            
            // Listar categorias
            if ($endpoint === 'categorias') {
                $stmt = $pdo->prepare("SELECT * FROM categorias ORDER BY nome");
                $stmt->execute();
                echo json_encode($stmt->fetchAll());
                break;
            }
            
            // Estatísticas
            if ($endpoint === 'stats') {
                $user = getCurrentUser($pdo);
                
                $stats = [];
                
                // Total de filmes
                $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM filmes");
                $stmt->execute();
                $stats['total_filmes'] = $stmt->fetch()['total'];
                
                // Filmes mais assistidos
                $stmt = $pdo->prepare("SELECT nomePortugues, assistencias FROM filmes ORDER BY assistencias DESC LIMIT 10");
                $stmt->execute();
                $stats['mais_assistidos'] = $stmt->fetchAll();
                
                // Filmes por categoria
                $stmt = $pdo->prepare("
                    SELECT 
                        JSON_UNQUOTE(JSON_EXTRACT(categoria, '$[0]')) as categoria,
                        COUNT(*) as total
                    FROM filmes 
                    GROUP BY JSON_UNQUOTE(JSON_EXTRACT(categoria, '$[0]'))
                    ORDER BY total DESC
                ");
                $stmt->execute();
                $stats['por_categoria'] = $stmt->fetchAll();
                
                if ($user) {
                    // Filmes assistidos pelo usuário
                    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM filmes_assistidos WHERE usuario_id = ?");
                    $stmt->execute([$user['id']]);
                    $stats['meus_assistidos'] = $stmt->fetch()['total'];
                    
                    // Filmes para assistir
                    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM filmes_para_assistir WHERE usuario_id = ?");
                    $stmt->execute([$user['id']]);
                    $stats['meus_para_assistir'] = $stmt->fetch()['total'];
                }
                
                echo json_encode($stats);
                break;
            }
            
            // Verificar usuário atual
            if ($endpoint === 'auth/me') {
                $user = getCurrentUser($pdo);
                if ($user) {
                    echo json_encode($user);
                } else {
                    http_response_code(401);
                    echo json_encode(['error' => 'Não autenticado']);
                }
                break;
            }
            
            break;
            
        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Atualizar filme
            if (preg_match('/^filmes\/([^\/]+)$/', $endpoint, $matches)) {
                $user = getCurrentUser($pdo);
                if (!$user || $user['tipo'] !== 'admin') {
                    http_response_code(403);
                    echo json_encode(['error' => 'Acesso negado']);
                    break;
                }
                
                $filmeGuid = $matches[1];
                
                $stmt = $pdo->prepare("
                    UPDATE filmes 
                    SET nomeOriginal = ?, nomePortugues = ?, ano = ?, categoria = ?, duracao = ?, 
                        sinopse = ?, embedLink = ?, imagemUrl = ?, videoGUID = ?, videoStatus = ?
                    WHERE GUID = ?
                ");
                
                $stmt->execute([
                    $input['nomeOriginal'],
                    $input['nomePortugues'],
                    $input['ano'],
                    json_encode($input['categoria']),
                    $input['duracao'],
                    $input['sinopse'],
                    $input['embedLink'] ?? null,
                    $input['imagemUrl'] ?? null,
                    $input['videoGUID'] ?? null,
                    $input['videoStatus'] ?? 'pending',
                    $filmeGuid
                ]);
                
                echo json_encode(['success' => true]);
                break;
            }
            
            break;
            
        case 'DELETE':
            // Sliders - remover
            if (preg_match('/^sliders\/([0-9]+)$/', $endpoint, $m)) {
                $id = (int)$m[1];
                $stmt = $pdo->prepare("DELETE FROM sliders WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true]);
                break;
            }
            // Remover filme
            if (preg_match('/^filmes\/([^\/]+)$/', $endpoint, $matches)) {
                $user = getCurrentUser($pdo);
                if (!$user || $user['tipo'] !== 'admin') {
                    http_response_code(403);
                    echo json_encode(['error' => 'Acesso negado']);
                    break;
                }
                
                $filmeGuid = $matches[1];
                
                $stmt = $pdo->prepare("DELETE FROM filmes WHERE GUID = ?");
                $stmt->execute([$filmeGuid]);
                
                echo json_encode(['success' => true]);
                break;
            }
            
            // Remover filme assistido
            if (preg_match('/^filmes\/([^\/]+)\/assistir$/', $endpoint, $matches)) {
                $user = getCurrentUser($pdo);
                if (!$user) {
                    http_response_code(401);
                    echo json_encode(['error' => 'Usuário não autenticado']);
                    break;
                }
                
                $filmeGuid = $matches[1];
                
                $stmt = $pdo->prepare("DELETE FROM filmes_assistidos WHERE usuario_id = ? AND filme_guid = ?");
                $stmt->execute([$user['id'], $filmeGuid]);
                
                echo json_encode(['success' => true]);
                break;
            }
            
            // Remover filme para assistir
            if (preg_match('/^filmes\/([^\/]+)\/para-assistir$/', $endpoint, $matches)) {
                $user = getCurrentUser($pdo);
                if (!$user) {
                    http_response_code(401);
                    echo json_encode(['error' => 'Usuário não autenticado']);
                    break;
                }
                
                $filmeGuid = $matches[1];
                
                $stmt = $pdo->prepare("DELETE FROM filmes_para_assistir WHERE usuario_id = ? AND filme_guid = ?");
                $stmt->execute([$user['id'], $filmeGuid]);
                
                echo json_encode(['success' => true]);
                break;
            }
            
            break;
            
        // ===== ENDPOINTS DE AVALIAÇÕES =====
        case 'POST':
            // Adicionar/atualizar interação do usuário
            if (preg_match('/^avaliacoes\/([^\/]+)\/(assistido|quero_ver|favorito|avaliacao)$/', $endpoint, $matches)) {
                $user = getCurrentUser($pdo);
                if (!$user) {
                    http_response_code(401);
                    echo json_encode(['error' => 'Usuário não autenticado']);
                    break;
                }
                
                $filmeGuid = $matches[1];
                $tipoInteracao = $matches[2];
                $valor = null;
                
                if ($tipoInteracao === 'avaliacao') {
                    $input = json_decode(file_get_contents('php://input'), true);
                    $valor = $input['valor'] ?? null;
                    
                    if (!$valor || $valor < 1 || $valor > 5) {
                        http_response_code(400);
                        echo json_encode(['error' => 'Avaliação deve ser entre 1 e 5']);
                        break;
                    }
                }
                
                // Verificar se o filme existe
                $stmt = $pdo->prepare("SELECT GUID FROM filmes WHERE GUID = ?");
                $stmt->execute([$filmeGuid]);
                if (!$stmt->fetch()) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Filme não encontrado']);
                    break;
                }
                
                // Inserir ou atualizar interação
                $stmt = $pdo->prepare("
                    INSERT INTO avaliacoes_usuarios (usuario_id, filme_guid, tipo_interacao, valor) 
                    VALUES (?, ?, ?, ?) 
                    ON DUPLICATE KEY UPDATE valor = VALUES(valor), data_atualizacao = CURRENT_TIMESTAMP
                ");
                
                $stmt->execute([$user['email'], $filmeGuid, $tipoInteracao, $valor]);
                
                echo json_encode(['success' => true]);
                break;
            }
            
            break;
            
        case 'GET':
            // Obter interações do usuário
            if (preg_match('/^avaliacoes\/usuario$/', $endpoint)) {
                $user = getCurrentUser($pdo);
                if (!$user) {
                    http_response_code(401);
                    echo json_encode(['error' => 'Usuário não autenticado']);
                    break;
                }
                
                $stmt = $pdo->prepare("
                    SELECT filme_guid, tipo_interacao, valor, data_criacao 
                    FROM avaliacoes_usuarios 
                    WHERE usuario_id = ?
                    ORDER BY data_criacao DESC
                ");
                $stmt->execute([$user['email']]);
                $interacoes = $stmt->fetchAll();
                
                echo json_encode($interacoes);
                break;
            }
            
            // Obter estatísticas de um filme
            if (preg_match('/^avaliacoes\/filme\/([^\/]+)$/', $endpoint, $matches)) {
                $filmeGuid = $matches[1];
                
                $stmt = $pdo->prepare("
                    SELECT * FROM estatisticas_filmes 
                    WHERE filme_guid = ?
                ");
                $stmt->execute([$filmeGuid]);
                $estatisticas = $stmt->fetch();
                
                if (!$estatisticas) {
                    $estatisticas = [
                        'filme_guid' => $filmeGuid,
                        'total_assistidos' => 0,
                        'total_quero_ver' => 0,
                        'total_favoritos' => 0,
                        'total_avaliacoes' => 0,
                        'media_avaliacao' => 0.00
                    ];
                }
                
                echo json_encode($estatisticas);
                break;
            }
            
            // Obter filmes mais populares
            if (preg_match('/^avaliacoes\/populares$/', $endpoint)) {
                $stmt = $pdo->prepare("
                    SELECT f.GUID, f.nomePortugues, f.nomeOriginal, f.ano, f.imagemUrl,
                           e.total_assistidos, e.total_favoritos, e.media_avaliacao
                    FROM filmes f
                    LEFT JOIN estatisticas_filmes e ON f.GUID = e.filme_guid
                    WHERE e.total_assistidos > 0 OR e.total_favoritos > 0
                    ORDER BY e.total_assistidos DESC, e.total_favoritos DESC
                    LIMIT 10
                ");
                $stmt->execute();
                $populares = $stmt->fetchAll();
                
                echo json_encode($populares);
                break;
            }
            
            break;
            
        case 'DELETE':
            // Remover interação do usuário
            if (preg_match('/^avaliacoes\/([^\/]+)\/(assistido|quero_ver|favorito|avaliacao)$/', $endpoint, $matches)) {
                $user = getCurrentUser($pdo);
                if (!$user) {
                    http_response_code(401);
                    echo json_encode(['error' => 'Usuário não autenticado']);
                    break;
                }
                
                $filmeGuid = $matches[1];
                $tipoInteracao = $matches[2];
                
                $stmt = $pdo->prepare("
                    DELETE FROM avaliacoes_usuarios 
                    WHERE usuario_id = ? AND filme_guid = ? AND tipo_interacao = ?
                ");
                $stmt->execute([$user['email'], $filmeGuid, $tipoInteracao]);
                
                echo json_encode(['success' => true]);
                break;
            }
            
            break;
            

            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método não permitido']);
            break;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro interno: ' . $e->getMessage()]);
}
?>
