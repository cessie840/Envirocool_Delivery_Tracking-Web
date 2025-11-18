<?php
include 'database.php';

$allowed_origins = [
    "https://cessie840.github.io",
    "http://localhost:5173",
    "http://localhost:5173/add-delivery"
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

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
