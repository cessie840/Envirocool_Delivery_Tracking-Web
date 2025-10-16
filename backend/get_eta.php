<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include 'database.php';

$device_id = $_GET['device_id'] ?? '';
$distance_to_customer_km = floatval($_GET['distance_km'] ?? 0);

function haversineDistance($lat1, $lon1, $lat2, $lon2) {
    $earthRadius = 6371; // km
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);

    $a = sin($dLat / 2) ** 2 +
         cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
         sin($dLon / 2) ** 2;

    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
    return $earthRadius * $c;
}

// Fetch last 10 points
$stmt = $conn->prepare("
    SELECT lat, lng, recorded_at 
    FROM gps_coordinates 
    WHERE device_id=? 
    ORDER BY recorded_at DESC 
    LIMIT 10
");
$stmt->bind_param("s", $device_id);
$stmt->execute();
$result = $stmt->get_result();

$gps_points = [];
while ($row = $result->fetch_assoc()) {
    $gps_points[] = $row;
}
$stmt->close();

// If no GPS data, return error
if (count($gps_points) < 2) {
    echo json_encode([
        'avg_speed_kmh' => 0,
        'distance_to_customer_km' => $distance_to_customer_km,
        'eta' => "No recent GPS data",
        'status' => "No GPS data"
    ]);
    exit;
}

// Reverse for chronological order
$gps_points = array_reverse($gps_points);

$total_distance = 0;
$total_time = 0;
$last_moving_speed = 0;
$valid_points = 0;
$now = time();

for ($i = 1; $i < count($gps_points); $i++) {
    $lat_prev = $gps_points[$i - 1]['lat'];
    $lng_prev = $gps_points[$i - 1]['lng'];
    $lat_curr = $gps_points[$i]['lat'];
    $lng_curr = $gps_points[$i]['lng'];

    $time_prev = strtotime($gps_points[$i - 1]['recorded_at']);
    $time_curr = strtotime($gps_points[$i]['recorded_at']);
    $time_diff_hours = ($time_curr - $time_prev) / 3600;

    // Skip data older than 2 hours
    if (($now - $time_curr) > 7200) continue;

    $dist = haversineDistance($lat_prev, $lng_prev, $lat_curr, $lng_curr);

    if ($dist > 0 && $time_diff_hours > 0) {
        $speed = $dist / $time_diff_hours;

        // Ignore unrealistic speeds (e.g., GPS jump)
        if ($speed > 120) continue;

        $last_moving_speed = $speed;
        $weight = $i; // newer data = more weight
        $total_distance += $dist * $weight;
        $total_time += $time_diff_hours * $weight;
        $valid_points++;
    }
}

// Compute weighted average speed
$avg_speed_kmh = ($total_time > 0) ? ($total_distance / $total_time) : $last_moving_speed;

// Minimal fallback speed if no movement detected
if ($avg_speed_kmh <= 0) {
    $avg_speed_kmh = 10;
}

$status = "Active";

$latest_record_time = strtotime(end($gps_points)['recorded_at']);
$time_diff_since_last = time() - $latest_record_time;

// 1️⃣ Detect truck activity status
if ($time_diff_since_last > 1800) { 
    $status = "Inactive";
} elseif ($time_diff_since_last > 900) {
    $status = "Stale GPS signal";
}

// 2️⃣ Compute ETA
$eta_hours = $distance_to_customer_km / $avg_speed_kmh;
$eta_seconds = $eta_hours * 3600;
$eta_timestamp = time() + $eta_seconds;

// 3️⃣ Round ETA to nearest 5 minutes
$eta_timestamp = round($eta_timestamp / 300) * 300; // 300 seconds = 5 mins

// 4️⃣ Format without seconds (e.g., "2025-10-16 14:45")
$eta = date('Y-m-d H:i', $eta_timestamp);

echo json_encode([
    'avg_speed_kmh' => round($avg_speed_kmh, 2),
    'distance_to_customer_km' => $distance_to_customer_km,
    'eta' => $eta,
    'status' => $status,
    'valid_points_used' => $valid_points
]);
?>
