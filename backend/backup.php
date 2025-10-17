<?php
$allowed_origins = [
    "https://cessie840.github.io",
    "http://localhost:5173",
    "http://localhost:5173/Envirocool-Tracking-Page"
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
} else {
    // optional fallback
    header("Access-Control-Allow-Origin: http://localhost:5173");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}


include 'database.php';

//CREATE DATABASE FOR TESTING 
// $host = 'localhost';
// $user = 'root';
// $password = '';
// $database = 'backuprestore';  

$backupFile = "backup_" . date("Y-m-d_H-i-s") . "_{$database}.sql";

$mysqldumpPath = "C:\\xampp\\mysql\\bin\\mysqldump.exe";

$command = "\"{$mysqldumpPath}\" --user={$user} --password={$password} --host={$host} {$database}";

header('Content-Type: application/octet-stream');
header("Content-Disposition: attachment; filename={$backupFile}");
header('Pragma: no-cache');
header('Expires: 0');

passthru($command);

exit;
?>
