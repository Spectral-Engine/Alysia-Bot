<?php
header('Content-Type: application/json');

$host = '';
$db = '';
$user = '';
$pass = '';
$port = 21;

try 
{
    $dsn = "mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $stmt = $pdo->prepare("SELECT * FROM top_serveur ORDER BY vote_at_withdraw DESC");
    $stmt->execute();
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['status' => 'success','data' => $data], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} 
catch (PDOException $e) 
{
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
