<?php

$host = '';
$db = '';
$user = '';
$pass = '';
$port = 21;

try 
{
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    error_log("✅ Connexion à la base de données réussie.");
} 
catch (PDOException $e) 
{
    error_log("❌ Erreur de connexion: " . $e->getMessage());
    die("Erreur de connexion: " . $e->getMessage());
}

$apiUrl = "https://api.top-serveurs.net/v1/servers/6AECCG43HYBS/players-ranking";

$response = file_get_contents($apiUrl);
if ($response === false) 
{
    error_log("❌ Erreur lors de la récupération des données de l'API.");
    die("Erreur API");
}

$data = json_decode($response, true);

if (!$data['success'] || !isset($data['players'])) 
{
    error_log("❌ Données invalides depuis l'API.");
    die("Données invalides");
}

$players = $data['players'];

foreach ($players as $player) 
{
    $playername = $player['playername'];
    $votes_api = (int)$player['votes'];

    $stmt = $pdo->prepare("SELECT * FROM top_serveur WHERE discord_rp_name = :playername");
    $stmt->execute(['playername' => $playername]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result) 
    {
        $bank_value = (int)$result['bank_value'];
        $vote_value = (int)$result['vote_value'];
        $vote_at_withdraw = (int)$result['vote_at_withdraw'];
        $votes_diff = $vote_value - $vote_at_withdraw;

        $update_vote = $pdo->prepare("UPDATE top_serveur SET vote_value = :votes_api WHERE discord_rp_name = :playername");
        $update_vote->execute(['votes_api' => $votes_api, 'playername' => $playername]);

        if ($votes_diff > 0 && ($bank_value < ($votes_diff * 10000))) 
        {
            $bonus = $votes_diff * 10000;

            $update_bonus = $pdo->prepare("UPDATE top_serveur SET bank_value = /*bank_value +*/ :bonus, date_at_withdraw = NOW() WHERE discord_rp_name = :playername");
            $update_bonus->execute(['bonus' => $bonus, 'playername' => $playername]);

            echo "✅ $playername : +$votes_diff votes → +$bonus$ ajoutés à bank_value.<br>";
        } 
        else 
        {
            echo "ℹ️ $playername : Vote_value mis à jour sans ajout de bonus.<br>";
        }
    }
    else 
    {
        echo "❌ Aucun match pour <strong>$playername</strong> dans la base de données.<br>";
    }
}
?>
