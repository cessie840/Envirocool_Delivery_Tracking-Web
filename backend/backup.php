<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Preflight check
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include 'database.php';

// File name with timestamp
$backupFile = "backup_" . date("Y-m-d_H-i-s") . ".sql";

// Adjust path if needed (XAMPP example: C:\\xampp\\mysql\\bin\\mysqldump.exe)
$mysqldumpPath = "mysqldump"; 

// Command to dump database
$command = "$mysqldumpPath --user={$user} --password={$password} --host={$host} {$database}";

// Set headers for file download
header('Content-Type: application/octet-stream');
header("Content-Disposition: attachment; filename={$backupFile}");
header('Pragma: no-cache');
header('Expires: 0');

// Execute dump
passthru($command);
exit;
?>
