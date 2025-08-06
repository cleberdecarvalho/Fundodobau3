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
$db = 'fundod14_fundodobau';
$user = 'fundod14_fundodobau';
$pass = '4z]8(AHekxVr';
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

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    exit;
}

try {
    switch ($method) {
        case 'GET':
            // Obter configuração do carrossel
            $stmt = $pdo->query("SELECT * FROM carrossel WHERE ativo = 1 ORDER BY posicao");
            $carrossel = $stmt->fetchAll();
            
            echo json_encode(['success' => true, 'carrossel' => $carrossel]);
            break;
            
        case 'POST':
            // Salvar configuração do carrossel
            $input = json_decode(file_get_contents('php://input'), true);
            
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
