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

// Para requisições POST, verificar se o endpoint está no body
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (isset($input['endpoint'])) {
        $endpoint = $input['endpoint'];
    }
}

if ($method === 'OPTIONS') {
    exit;
}

try {
    switch ($method) {
        case 'GET':
            // Listar filmes
            if ($action === 'list') {
                $stmt = $pdo->query("
                    SELECT 
                        GUID,
                        nomeOriginal,
                        nomePortugues,
                        ano,
                        categoria,
                        duracao,
                        sinopse,
                        embedLink,
                        imagemUrl,
                        videoGUID,
                        videoStatus,
                        assistencias,
                        avaliacoes,
                        createdAt,
                        updatedAt
                    FROM filmes 
                    ORDER BY createdAt DESC
                ");
                $filmes = $stmt->fetchAll();
                
                // Converter JSON de volta para array
                foreach ($filmes as &$filme) {
                    // Garantir que campos obrigatórios não sejam NULL
                    $filme['nomeOriginal'] = $filme['nomeOriginal'] ?: '';
                    $filme['nomePortugues'] = $filme['nomePortugues'] ?: '';
                    $filme['ano'] = $filme['ano'] ?: '';
                    $filme['duracao'] = $filme['duracao'] ?: '';
                    $filme['categoria'] = json_decode($filme['categoria'], true) ?: [];
                    $filme['sinopse'] = $filme['sinopse'] ?: '';
                    $filme['embedLink'] = $filme['embedLink'] ?: '';
                    $filme['imagemUrl'] = $filme['imagemUrl'] ?: '';
                    $filme['videoGUID'] = $filme['videoGUID'] ?: '';
                    $filme['videoStatus'] = $filme['videoStatus'] ?: 'Processado';
                    $filme['assistencias'] = $filme['assistencias'] ?: 0;
                    $filme['avaliacoes'] = $filme['avaliacoes'] ? json_decode($filme['avaliacoes'], true) : null;
                }
                
                echo json_encode(['success' => true, 'filmes' => $filmes]);
                break;
            }
            
            // Obter carrossel
            if ($action === 'carrossel') {
                try {
                    $stmt = $pdo->query("SELECT * FROM carrossel WHERE ativo = 1 ORDER BY posicao");
                    $carrossel = $stmt->fetchAll();
                    
                    echo json_encode(['success' => true, 'carrossel' => $carrossel]);
                } catch (Exception $e) {
                    http_response_code(500);
                    echo json_encode(['error' => 'Erro ao obter carrossel: ' . $e->getMessage()]);
                }
                break;
            }
            
            // Buscar filme por GUID
            if (preg_match('/^filmes\/([^\/]+)$/', $endpoint, $matches)) {
                $guid = $matches[1];
                $stmt = $pdo->prepare("
                    SELECT 
                        GUID,
                        nomeOriginal,
                        nomePortugues,
                        ano,
                        categoria,
                        duracao,
                        sinopse,
                        embedLink,
                        imagemUrl,
                        videoGUID,
                        videoStatus,
                        assistencias,
                        avaliacoes,
                        createdAt,
                        updatedAt
                    FROM filmes 
                    WHERE GUID = ?
                ");
                $stmt->execute([$guid]);
                $filme = $stmt->fetch();
                
                if ($filme) {
                    // Garantir que campos obrigatórios não sejam NULL
                    $filme['nomeOriginal'] = $filme['nomeOriginal'] ?: '';
                    $filme['nomePortugues'] = $filme['nomePortugues'] ?: '';
                    $filme['ano'] = $filme['ano'] ?: '';
                    $filme['duracao'] = $filme['duracao'] ?: '';
                    $filme['categoria'] = json_decode($filme['categoria'], true) ?: [];
                    $filme['sinopse'] = $filme['sinopse'] ?: '';
                    $filme['embedLink'] = $filme['embedLink'] ?: '';
                    $filme['imagemUrl'] = $filme['imagemUrl'] ?: '';
                    $filme['videoGUID'] = $filme['videoGUID'] ?: '';
                    $filme['videoStatus'] = $filme['videoStatus'] ?: 'Processado';
                    $filme['assistencias'] = $filme['assistencias'] ?: 0;
                    $filme['avaliacoes'] = $filme['avaliacoes'] ? json_decode($filme['avaliacoes'], true) : null;
                    echo json_encode(['success' => true, 'filme' => $filme]);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Filme não encontrado']);
                }
                break;
            }
            
            // Obter configuração do carrossel - ENDPOINT SIMPLIFICADO
            if ($endpoint === 'carrossel') {
                header('Content-Type: application/json');
                try {
                    $stmt = $pdo->query("SELECT * FROM carrossel WHERE ativo = 1 ORDER BY posicao");
                    $carrossel = $stmt->fetchAll();
                    echo json_encode(['success' => true, 'carrossel' => $carrossel]);
                } catch (Exception $e) {
                    http_response_code(500);
                    echo json_encode(['error' => 'Erro ao obter carrossel: ' . $e->getMessage()]);
                }
                exit;
            }
            
            // Rota padrão - listar filmes
            try {
                $stmt = $pdo->query("SELECT * FROM filmes ORDER BY createdAt DESC");
                $filmes = $stmt->fetchAll();
                
                foreach ($filmes as &$filme) {
                    // Garantir que campos obrigatórios não sejam NULL
                    $filme['nomeOriginal'] = $filme['nomeOriginal'] ?: '';
                    $filme['nomePortugues'] = $filme['nomePortugues'] ?: '';
                    $filme['ano'] = $filme['ano'] ?: '';
                    $filme['duracao'] = $filme['duracao'] ?: '';
                    $filme['categoria'] = json_decode($filme['categoria'], true) ?: [];
                    $filme['sinopse'] = $filme['sinopse'] ?: '';
                    $filme['embedLink'] = $filme['embedLink'] ?: '';
                    $filme['imagemUrl'] = $filme['imagemUrl'] ?: '';
                    $filme['videoGUID'] = $filme['videoGUID'] ?: '';
                    $filme['videoStatus'] = $filme['videoStatus'] ?: 'Processado';
                    $filme['assistencias'] = $filme['assistencias'] ?: 0;
                    $filme['avaliacoes'] = $filme['avaliacoes'] ? json_decode($filme['avaliacoes'], true) : null;
                }
                
                echo json_encode(['success' => true, 'filmes' => $filmes]);
            } catch (Exception $e) {
                error_log("Erro na consulta: " . $e->getMessage());
                echo json_encode(['error' => 'Erro interno: ' . $e->getMessage()]);
            }
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
        case 'PUT':
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
            
            // Upload de imagem do carrossel
            if ($endpoint === 'upload-imagem-carrossel') {
                try {
                    $imagemBase64 = $input['imagemBase64'] ?? '';
                    $nomeFilme = $input['nomeFilme'] ?? '';
                    $posicao = $input['posicao'] ?? 0;
                    
                    if (empty($imagemBase64) || empty($nomeFilme)) {
                        http_response_code(400);
                        echo json_encode(['error' => 'Imagem e nome do filme são obrigatórios']);
                        exit;
                    }
                    
                    // Extrair dados da imagem base64
                    $data = explode(',', $imagemBase64);
                    if (count($data) !== 2) {
                        http_response_code(400);
                        echo json_encode(['error' => 'Formato de imagem inválido']);
                        exit;
                    }
                    
                    $imageData = base64_decode($data[1]);
                    $finfo = finfo_open(FILEINFO_MIME_TYPE);
                    $mimeType = finfo_buffer($finfo, $imageData);
                    finfo_close($finfo);
                    
                    // Determinar extensão baseada no MIME type
                    $extensions = [
                        'image/jpeg' => 'jpg',
                        'image/jpg' => 'jpg',
                        'image/png' => 'png',
                        'image/gif' => 'gif',
                        'image/webp' => 'webp'
                    ];
                    
                    $extension = $extensions[$mimeType] ?? 'jpg';
                    
                    // Criar nome do arquivo
                    $nomeArquivo = 'carrossel-' . $posicao . '-' . strtolower(preg_replace('/[^a-zA-Z0-9]/', '-', $nomeFilme)) . '.' . $extension;
                    $caminhoCompleto = '/home/fundod14/public_html/images/carrossel/' . $nomeArquivo;
                    
                    // Garantir que o diretório existe
                    $diretorio = dirname($caminhoCompleto);
                    if (!is_dir($diretorio)) {
                        mkdir($diretorio, 0755, true);
                    }
                    
                    // Salvar arquivo
                    if (file_put_contents($caminhoCompleto, $imageData)) {
                        $caminhoUrl = '/images/carrossel/' . $nomeArquivo;
                        echo json_encode([
                            'success' => true,
                            'caminho' => $caminhoUrl,
                            'arquivo' => $nomeArquivo
                        ]);
                    } else {
                        http_response_code(500);
                        echo json_encode(['error' => 'Erro ao salvar arquivo']);
                    }
                    exit;
                } catch (Exception $e) {
                    http_response_code(500);
                    echo json_encode(['error' => 'Erro ao processar imagem: ' . $e->getMessage()]);
                    exit;
                }
            }
            
            // Salvar configuração do carrossel
            if ($endpoint === 'carrossel') {
                try {
                    if (!isset($input['carrossel']) || !is_array($input['carrossel'])) {
                        http_response_code(400);
                        echo json_encode(['error' => 'Dados do carrossel são obrigatórios']);
                        break;
                    }
                    
                    // Limpar carrossel atual
                    $stmt = $pdo->prepare("UPDATE carrossel SET ativo = 0");
                    $stmt->execute();
                    
                    // Inserir nova configuração
                    foreach ($input['carrossel'] as $item) {
                        if (isset($item['posicao']) && isset($item['filmeId']) && isset($item['imagemUrl'])) {
                            $stmt = $pdo->prepare("
                                INSERT INTO carrossel (posicao, filmeId, imagemUrl, ativo) 
                                VALUES (?, ?, ?, ?) 
                                ON DUPLICATE KEY UPDATE 
                                filmeId = VALUES(filmeId), 
                                imagemUrl = VALUES(imagemUrl), 
                                ativo = VALUES(ativo)
                            ");
                            $stmt->execute([
                                $item['posicao'],
                                $item['filmeId'],
                                $item['imagemUrl'],
                                $item['ativo'] ?? true
                            ]);
                        }
                    }
                    
                    echo json_encode(['success' => true]);
                    exit;
                } catch (Exception $e) {
                    http_response_code(500);
                    echo json_encode(['error' => 'Erro ao salvar carrossel: ' . $e->getMessage()]);
                    exit;
                }
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
