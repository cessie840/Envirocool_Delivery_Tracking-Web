<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include 'database.php';

// CREATE DATABASE FOR TESTING 
// $host = 'localhost';
// $user = 'root';
// $password = '';
// $database = 'backuprestore'; 

header("Content-Type: application/json");

if (!isset($_FILES['sqlFile']) || $_FILES['sqlFile']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["success" => false, "message" => "No file uploaded or upload error."]);
    exit;
}

$sqlFile = $_FILES['sqlFile']['tmp_name'];

$mysqlPath = "C:\\xampp\\mysql\\bin\\mysql.exe";

$command = "cmd /c \"\"{$mysqlPath}\" --user={$user} --password={$password} --host={$host} {$database} < \"{$sqlFile}\"\"";

exec($command, $output, $result);

if ($result === 0) {
    echo json_encode(["success" => true, "message" => "Database restored successfully."]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Restore failed.",
        "command" => $command,
        "output" => $output,
        "result_code" => $result
    ]);
}
?>
