<?php
session_start();
if(!$_SESSION['logged_in'])
{
  $_SESSION['error_message'] = "Votre session a expiré.";  
  header("location: error.php");
  exit();
}
$username = $_SESSION['userData']['name'];
$avatar = $_SESSION['userData']['avatar'];
?>

<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" href="styles/alysia_red.ico" type="image/x-icon">
  <title>Alysia Roleplay</title>
  <link href="./styles/output.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css" integrity="sha512-KfkfwYDsLkIlwQp6LFnl8zNdLGxu9YAA1QvwINks4PhcElQSvqcyVLLD9aMhXd13uQjoXtEKNosOWaZqXgel0g==" crossorigin="anonymous" referrerpolicy="no-referrer" />
</head>
<body>
    <div class="flex items-center justify-center h-screen bg-steam-lightGray text-white flex-col">
    <div class="text-4xl mt-3 flex items-center font-medium">
            <img src='<?php echo $avatar;?>' class="rounded-full w-12 h-12 mr-3"/>
            <?php echo $username;?></div>
        <div class="text-2xl"><?php echo htmlspecialchars($_SESSION['success_message'] ?? 'Unknown message'); ?></div>
    </div>

    <?php
    unset($_SESSION['success_message']);
    ?>
</body>
</html>
