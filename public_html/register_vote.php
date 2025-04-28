<?php

$host = '';
$db = '';
$user = '';
$pass = '';
$port = 21;

try 
{
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} 
catch (PDOException $e)
{
    die("Erreur de connexion: " . $e->getMessage());
}

$discord_name = $_POST['discord_name'];
$discord_rp_name = $_POST['discord_rp_name'];
$vote_value = isset($_POST['vote_value']) ? intval($_POST['vote_value']) : 0;

$query = "SELECT * FROM top_serveur WHERE discord_rp_name = :discord_rp_name";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':discord_rp_name', $discord_rp_name);
$stmt->execute();

if ($stmt->rowCount() > 0) 
{
    echo json_encode(["success" => false, "error" => "Ce nom est déjà attribué à un autre compte Discord."]);
    exit;
}

$steam_id = getSteamIdFromRPName($discord_rp_name);
if ($steam_id === null) 
{
    echo json_encode(["success" => false, "error" => "Steam ID introuvable pour ce nom RP."]);
    exit;
}

$bank_value = $vote_value * 10000;
$vote_at_withdraw = 0;
$date_at_withdraw = date('Y-m-d H:i:s');

$query = "INSERT INTO top_serveur (discord_name, discord_rp_name, steam_id, bank_value, vote_value, vote_at_withdraw, date_at_withdraw) VALUES (:discord_name, :discord_rp_name, :steam_id, :bank_value, :vote_value, :vote_at_withdraw, :date_at_withdraw)";
$stmt = $pdo->prepare($query);

$stmt->bindParam(':discord_name', $discord_name);
$stmt->bindParam(':discord_rp_name', $discord_rp_name);
$stmt->bindParam(':steam_id', $steam_id);
$stmt->bindParam(':bank_value', $bank_value);
$stmt->bindParam(':vote_value', $vote_value); 
$stmt->bindParam(':vote_at_withdraw', $vote_at_withdraw);
$stmt->bindParam(':date_at_withdraw', $date_at_withdraw);

if ($stmt->execute()) 
{
    $response = ["success" => true, "message" => "Enregistrement réussi."];
    echo json_encode($response);
} 
else 
{
    $errorInfo = $stmt->errorInfo();
    $response = ["success" => false, "error" => "Une erreur s'est produite lors de l'enregistrement. " . implode(", ", $errorInfo)];
    echo json_encode($response);
}

function getSteamIdFromRPName($discord_rp_name) 
{
    global $pdo;
    $query = "SELECT uid FROM players WHERE profileName = :discord_rp_name";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':discord_rp_name', $discord_rp_name);
    $stmt->execute();
    if ($stmt->rowCount() > 0) 
    {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['uid'];
    }
    return null;
}
?>
