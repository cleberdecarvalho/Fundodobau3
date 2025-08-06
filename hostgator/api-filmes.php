<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Cache-Control, Pragma, Expires');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Configuração do banco
$host = 'localhost';
$db = 'fundod14_fundodobau'; // Nome do banco
$user = 'fundod14_fundodobau'; // Usuário do banco
$pass = '4z]8(AHekxVr'; // Senha do banco
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
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Rota base da API
$apiPath = end($pathParts) === 'api-filmes.php' ? '' : 'api-filmes.php/';
$endpoint = str_replace($apiPath, '', implode('/', $pathParts));

// Parâmetros GET
$action = $_GET['action'] ?? '';

if ($method === 'OPTIONS') {
    exit;
}

try {
    switch ($method) {
        case 'GET':
            // Listar filmes
            if ($action === 'list') {
                $stmt = $pdo->query("SELECT * FROM filmes ORDER BY createdAt DESC");
                $filmes = $stmt->fetchAll();
                
                // Converter JSON de volta para array
                foreach ($filmes as &$filme) {
                    $filme['categoria'] = json_decode($filme['categoria'], true);
                    $filme['avaliacoes'] = $filme['avaliacoes'] ? json_decode($filme['avaliacoes'], true) : null;
                }
                
                echo json_encode(['success' => true, 'filmes' => $filmes]);
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
            
            // Rota padrão - listar filmes
            $stmt = $pdo->query("SELECT * FROM filmes ORDER BY createdAt DESC");
            $filmes = $stmt->fetchAll();
            
            foreach ($filmes as &$filme) {
                $filme['categoria'] = json_decode($filme['categoria'], true);
                $filme['avaliacoes'] = $filme['avaliacoes'] ? json_decode($filme['avaliacoes'], true) : null;
            }
            
            echo json_encode(['success' => true, 'filmes' => $filmes]);
            break;
            
        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            
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
            
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint não encontrado']);
            break;
            
        case 'DELETE':
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
            
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint não encontrado']);
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
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
