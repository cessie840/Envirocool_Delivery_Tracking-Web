<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

include 'database.php';
header("Content-Type: application/json");

$result = $conn->query("SELECT DISTINCT device_id FROM gps_coordinates ORDER BY device_id ASC");

$devices = [];
while ($row = $result->fetch_assoc()) {
    $devices[] = $row;
}

echo json_encode($devices);
?>
