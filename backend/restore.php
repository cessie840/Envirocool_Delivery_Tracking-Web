<?php

include 'database.php'; 
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174', 'https://cessie840.github.io'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
} else {
    header("Access-Control-Allow-Origin: http://localhost:5173"); // fallback
}

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (!isset($_FILES['sqlFile']) || $_FILES['sqlFile']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["success" => false, "message" => "No file uploaded or upload error."]);
    exit;
}
$tmpPath = $_FILES['sqlFile']['tmp_name'];

$backupDir = "C:\\xampp\\htdocs\\DeliveryTrackingSystem\\backups";
if (!is_dir($backupDir)) {
    mkdir($backupDir, 0777, true);
}

$targetFile = $backupDir . "\\" . basename($_FILES['sqlFile']['name']);
if (!move_uploaded_file($tmpPath, $targetFile)) {
    echo json_encode(["success" => false, "message" => "Failed to move uploaded file."]);
    exit;
}

$conn = new mysqli($host, $user, $password);
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]);
    exit;
}
$conn->query("CREATE DATABASE IF NOT EXISTS `$database`");
$conn->close();

$command = "\"{$mysqlPath}\" -u{$user}" . 
           ($password !== "" ? " -p{$password}" : "") . 
           " -h{$host} {$database} < \"{$targetFile}\"";


$output = shell_exec("cmd /c {$command} 2>&1");

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
