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
    error_log("Connexion à la base de données réussie.");
} 
catch (PDOException $e) 
{
    die("Erreur de connexion: " . $e->getMessage());
}

if (isset($_POST['discord_rp_name'])) 
{
    $discord_rp_name = $_POST['discord_rp_name'];

    function effectuerVirement($discord_rp_name, $pdo) 
    {
        try 
        {
            $query = "SELECT * FROM top_serveur WHERE discord_rp_name = ?";
            $stmt = $pdo->prepare($query);
            $stmt->execute([$discord_rp_name]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
            if (!$row) 
            {
                return json_encode(['success' => false, 'message' => 'Utilisateur non trouvé dans la base de données']);
            }
    
            $vote_value = $row['vote_value'];
            $vote_at_withdraw = $row['vote_at_withdraw'];
            $bank_value = $row['bank_value'];
            $uid = $row['steam_id'];
    
            if ($vote_value > $vote_at_withdraw && $bank_value > 0) 
            {
                $updateQuery = "UPDATE players SET CIV_atm = CIV_atm + ?, GUER_atm = GUER_atm + ?, EAST_atm = EAST_atm + ?, WEST_atm = WEST_atm + ? WHERE uid = ?";
                $updateStmt = $pdo->prepare($updateQuery);
                $updateStmt->execute([$bank_value, $bank_value, $bank_value, $bank_value, $uid]);

                $updateTopServeur = "UPDATE top_serveur SET vote_at_withdraw = ?, bank_value = 0 WHERE discord_rp_name = ?";
                $updateVoteStmt = $pdo->prepare($updateTopServeur);
                $updateVoteStmt->execute([$vote_value, $discord_rp_name]);
    
                return json_encode(['success' => true, 'message' => 'Virement effectué avec succès', 'bank_value_transferred' => $bank_value]);
            } 
            else 
            {
                return json_encode(['success' => false, 'message' => 'Virement refusé : aucun nouveau vote détecté ou solde nul.']);
            }
        } 
        catch (PDOException $e) 
        {
            return json_encode(['success' => false, 'message' => 'Erreur lors du virement: ' . $e->getMessage()]);
        }
    }
    
    $response = effectuerVirement($discord_rp_name, $pdo);
    echo $response;
} 
else 
{
    echo json_encode(['success' => false, 'message' => 'discord_rp_name non fourni']);
}
?>
