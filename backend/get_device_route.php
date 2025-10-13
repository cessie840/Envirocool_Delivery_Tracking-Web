<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include 'database.php';

$device_id = $_GET['device_id'] ?? '';

if (!$device_id) {
    echo json_encode([]);
    exit;
}

$sql = "SELECT lat, lng, recorded_at 
        FROM gps_coordinates 
        WHERE device_id = ? 
        ORDER BY recorded_at ASC";

$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $device_id);
$stmt->execute();
$result = $stmt->get_result();

$points = [];
while ($row = $result->fetch_assoc()) {
    $points[] = $row;
}

echo json_encode($points);
$conn->close();
?>
