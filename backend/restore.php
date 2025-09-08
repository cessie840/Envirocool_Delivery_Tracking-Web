<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Preflight check
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include 'database.php';

header("Content-Type: application/json");

// Ensure a file is uploaded
if (!isset($_FILES['sqlFile']) || $_FILES['sqlFile']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["error" => "No file uploaded or upload error."]);
    exit;
}

$sqlFile = $_FILES['sqlFile']['tmp_name'];

// Adjust path if needed (XAMPP example: C:\\xampp\\mysql\\bin\\mysql.exe)
$mysqlPath = "mysql";

// Command to restore database
$command = "$mysqlPath --user={$user} --password={$password} --host={$host} {$database} < {$sqlFile}";

// Run restore
exec($command, $output, $result);

if ($result === 0) {
    echo json_encode(["message" => "Database restored successfully."]);
} else {
    echo json_encode(["error" => "Restore failed.", "details" => $output]);
}
?>
