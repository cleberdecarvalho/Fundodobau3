<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Configuração do banco
$host = 'localhost';
$db = 'NOME_DO_BANCO';
$user = 'USUARIO';
$pass = 'SENHA';
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
    echo json_encode(['error' => 'Erro ao conectar ao banco de dados']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    exit;
}

switch ($method) {
    case 'GET':
        $stmt = $pdo->query('SELECT * FROM filmes ORDER BY id DESC');
        $filmes = $stmt->fetchAll();
        echo json_encode($filmes);
        break;
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $sql = 'INSERT INTO filmes (nomeOriginal, nomePortugues, ano, categoria, duracao, sinopse, imagemUrl, embedLink, videoGUID, videoStatus, assistencias) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        $pdo->prepare($sql)->execute([
            $data['nomeOriginal'],
            $data['nomePortugues'],
            $data['ano'],
            json_encode($data['categoria']),
            $data['duracao'],
            $data['sinopse'],
            $data['imagemUrl'],
            $data['embedLink'],
            $data['videoGUID'],
            $data['videoStatus'],
            $data['assistencias'] ?? 0
        ]);
        echo json_encode(['success' => true]);
        break;
    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        $sql = 'UPDATE filmes SET nomeOriginal=?, nomePortugues=?, ano=?, categoria=?, duracao=?, sinopse=?, imagemUrl=?, embedLink=?, videoGUID=?, videoStatus=?, assistencias=? WHERE id=?';
        $pdo->prepare($sql)->execute([
            $data['nomeOriginal'],
            $data['nomePortugues'],
            $data['ano'],
            json_encode($data['categoria']),
            $data['duracao'],
            $data['sinopse'],
            $data['imagemUrl'],
            $data['embedLink'],
            $data['videoGUID'],
            $data['videoStatus'],
            $data['assistencias'] ?? 0,
            $data['id']
        ]);
        echo json_encode(['success' => true]);
        break;
    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if ($id) {
            $pdo->prepare('DELETE FROM filmes WHERE id=?')->execute([$id]);
            echo json_encode(['success' => true]);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'ID não informado']);
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método não suportado']);
}
