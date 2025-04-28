<?php
session_start();
function p($arr)
{
    return '<pre>'.print_r($arr,true).'</pre>';
}
$displayName = $_SESSION['displayName'] ?? 'non_defini';
$userName = $_SESSION['userName'] ?? 'non_defini';



$params = [
    'openid.assoc_handle' => $_GET['openid_assoc_handle'],
    'openid.signed'       => $_GET['openid_signed'],
    'openid.sig'          => $_GET['openid_sig'],
    'openid.ns'           => 'http://specs.openid.net/auth/2.0',
    'openid.mode'         => 'check_authentication',
];

$signed = explode(',', $_GET['openid_signed']);
    
foreach ($signed as $item) {
    $val = $_GET['openid_'.str_replace('.', '_', $item)];
    $params['openid.'.$item] = stripslashes($val);
}

$data = http_build_query($params);

$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => "Accept-language: en\r\n".
        "Content-type: application/x-www-form-urlencoded\r\n".
        'Content-Length: '.strlen($data)."\r\n",
        'content' => $data,
    ],
]);

$result = file_get_contents('https://steamcommunity.com/openid/login', false, $context);

if(preg_match("#is_valid\s*:\s*true#i", $result)){
    preg_match('#^https://steamcommunity.com/openid/id/([0-9]{17,25})#', $_GET['openid_claimed_id'], $matches);
    $steamID64 = is_numeric($matches[1]) ? $matches[1] : 0;

} else {
    echo 'error: unable to validate your request';
    exit();
}

$steam_api_key = '00000000000000000000000000000';

$response = file_get_contents('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key='.$steam_api_key.'&steamids='.$steamID64);
$response = json_decode($response,true);


$userData = $response['response']['players'][0];

$_SESSION['logged_in'] = true;
$_SESSION['userData'] = [
    'steam_id'=>$userData['steamid'],
    'name'=>$userData['personaname'],
    'avatar'=>$userData['avatarmedium'],
];


$host = '';
$db = '';
$user = '';
$pass = '';
$port = 21;

try 
{
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->prepare("SELECT profileName FROM players WHERE uid = ?");
    $stmt->execute([$steamID64]);
    $playerData = $stmt->fetch();

    if ($playerData) 
    {
        if ($displayName === $playerData['profileName']) 
        {
            
            $stmt = $pdo->prepare("SELECT * FROM top_serveur WHERE steam_id = ? OR discord_rp_name = ?");
            $stmt->execute([$steamID64, $displayName]);
            $topEntryExists = $stmt->fetch();

            if (!$topEntryExists) 
            {
                $insertTop = $pdo->prepare("INSERT INTO top_serveur (discord_name, discord_rp_name, steam_id, vote_value, bank_value, vote_at_withdraw, date_at_withdraw) VALUES (?, ?, ?, 0, 0, 0, NOW())");
                $insertTop->execute([$userName, $displayName, $steamID64]);
            }
            else
            {
                $_SESSION['error_message'] = "Votre compte steam a déja été authenfité sur notre serveur.";
                header("Location: error.php");
                exit();
            }
        }
        else
        {
            $_SESSION['error_message'] = "Votre pseudo Discord ne correspond pas à votre prénom/nom roleplay sur notre serveur.";
            header("Location: error.php");
            exit();
        }
    }
    else
    {
        $_SESSION['error_message'] = "Impossible de trouver votre Steam ID dans la base de données. Assurez-vous d'avoir déjà rejoint notre serveur avant de vous authentifier.";
        header("Location: error.php");
        exit();
    }
}
catch (PDOException $e) 
{
    $_SESSION['error_message'] = $e->getMessage();
    header("Location: error.php");
    exit();
}


$_SESSION['success_message'] = "Vous avez été authentifié avec succès.";
header("Location: success.php"); 
exit();