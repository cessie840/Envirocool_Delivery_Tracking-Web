<?php
require 'config.php';

$sql = "SELECT device_id, lat, lng, updated_at FROM current_positions";
$result = $db->query($sql);

header('Content-Type: application/json');

if (!$result) {
    echo json_encode(["error" => $db->error]);
    exit;
}

$devices = [];
while ($row = $result->fetch_assoc()) {

    $devices[] = [
        "device_id" => $row["device_id"],
        "lat"       => (float) $row["lat"],
        "lng"       => (float) $row["lng"],
        "updated_at"=> $row["updated_at"]
    ];
}

echo json_encode($devices);
