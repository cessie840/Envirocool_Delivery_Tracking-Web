<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include 'database.php'; // optional if you use same credentials

header("Content-Type: application/json");

// ==== CONFIGURATION ====
$host = "localhost";
$user = "root";
$password = "091203"; // leave blank if no password
$database = "DeliveryTrackingSystem";
$mysqlPath = "C:\\xampp\\mysql\\bin\\mysql.exe";

// ==== CHECK FILE ====
if (!isset($_FILES['sqlFile']) || $_FILES['sqlFile']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["success" => false, "message" => "No file uploaded or upload error."]);
    exit;
}

$tmpPath = $_FILES['sqlFile']['tmp_name'];

// Copy to a stable, accessible directory
$backupDir = "C:\\xampp\\htdocs\\DeliveryTrackingSystem\\backups";
if (!is_dir($backupDir)) {
    mkdir($backupDir, 0777, true);
}

$targetFile = $backupDir . "\\" . basename($_FILES['sqlFile']['name']);
if (!move_uploaded_file($tmpPath, $targetFile)) {
    echo json_encode(["success" => false, "message" => "Failed to move uploaded file."]);
    exit;
}

// ==== ENSURE DATABASE EXISTS ====
$conn = new mysqli($host, $user, $password);
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]);
    exit;
}
$conn->query("CREATE DATABASE IF NOT EXISTS `$database`");
$conn->close();

// ==== RUN RESTORE ====
$command = "\"{$mysqlPath}\" -u{$user}" . 
           ($password !== "" ? " -p{$password}" : "") . 
           " -h{$host} {$database} < \"{$targetFile}\"";

// run via shell_exec to capture output
$output = shell_exec("cmd /c {$command} 2>&1");

// ==== CHECK RESULT ====
if (strpos($output, 'ERROR') === false && strpos($output, 'error') === false) {
    echo json_encode([
        "success" => true,
        "message" => "Database restored successfully.",
        "command" => $command,
        "output" => $output
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Restore failed.",
        "command" => $command,
        "output" => $output
    ]);
}
?>
