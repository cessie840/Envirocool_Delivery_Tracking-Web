<?php
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174', 'https://cessie840.github.io','https://envirocool-delivery-tracking-web.vercel.app'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

include 'database.php';

$result = $conn->query("SELECT DISTINCT device_id FROM gps_coordinates ORDER BY device_id ASC");

$devices = [];
while ($row = $result->fetch_assoc()) {
    $devices[] = $row;
}

echo json_encode($devices);
?>
