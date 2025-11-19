<?php
header("Access-Control-Allow-Origin: https://envirocool-delivery-tracking-web.vercel.app");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include 'database.php';

header("Content-Type: application/json");

// Check uploaded file
if (!isset($_FILES['sqlFile']) || $_FILES['sqlFile']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["success" => false, "message" => "No file uploaded or upload error."]);
    exit;
}

$sqlFile = $_FILES['sqlFile']['tmp_name'];

// MySQL path on Linux (default)
$mysqlPath = "/usr/bin/mysql";

// Escape shell arguments for safety
$escapedUser = escapeshellarg($user);
$escapedPass = escapeshellarg($password);
$escapedHost = escapeshellarg($host);
$escapedDB = escapeshellarg($database);
$escapedFile = escapeshellarg($sqlFile);

// Build the command with --force to overwrite existing tables/data
$command = "{$mysqlPath} --force -u{$user}" .
           ($password !== "" ? " -p{$password}" : "") .
           " -h{$host} {$database} < {$sqlFile}";

// Execute command
$output = [];
$returnVar = 0;
exec($command . " 2>&1", $output, $returnVar);

// Respond
if ($returnVar === 0) {
    echo json_encode([
        "success" => true,
        "message" => "Database restored successfully.",
        "command" => $command,
        "output" => implode("\n", $output)
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Restore failed.",
        "command" => $command,
        "output" => implode("\n", $output),
        "result_code" => $returnVar
    ]);
}
?>
