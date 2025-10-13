<?php
require 'config.php';

// Query all latest device positions
$sql = "SELECT device_id, lat, lng, updated_at FROM current_positions";
$result = $db->query($sql);

// Always return JSON
header('Content-Type: application/json');

// Handle query error
if (!$result) {
    echo json_encode(["error" => $db->error]);
    exit;
}

$devices = [];
while ($row = $result->fetch_assoc()) {
    // Ensure proper numeric formatting
    $devices[] = [
        "device_id" => $row["device_id"],
        "lat"       => (float) $row["lat"],
        "lng"       => (float) $row["lng"],
        "updated_at"=> $row["updated_at"]
    ];
}

echo json_encode($devices);
