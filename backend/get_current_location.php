<?php
header("Access-Control-Allow-Origin: http://localhost:5173"); // allow your frontend
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'database.php';

$device_id = $_GET['device_id'] ?? '';

if (!$device_id) {
    echo json_encode(['success' => false, 'message' => 'Device ID missing']);
    exit;
}

// Fetch latest GPS for this device including recorded_at
$sql = "SELECT lat, lng, recorded_at
        FROM gps_coordinates 
        WHERE device_id = ? 
        ORDER BY recorded_at DESC 
        LIMIT 1";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $device_id);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();

if ($row) {
    echo json_encode(['success' => true, 'data' => $row]);
} else {
    echo json_encode(['success' => false, 'data' => null]);
}

$conn->close();
?>
