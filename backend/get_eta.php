<?php
date_default_timezone_set('Asia/Manila');
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include 'database.php';

$device_id = $_GET['device_id'] ?? '';
$distance_to_customer_km = floatval($_GET['distance_km'] ?? 0);

function haversineDistance($lat1, $lon1, $lat2, $lon2) {
    $earthRadius = 6371;
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    $a = sin($dLat / 2) ** 2 +
         cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
         sin($dLon / 2) ** 2;
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
    return $earthRadius * $c;
}


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

if (count($gps_points) < 2) {
    echo json_encode([
        'avg_speed_kmh' => 0,
        'distance_to_customer_km' => $distance_to_customer_km,
        'eta' => "No recent GPS data",
        'status' => "No GPS data",
        'stop_duration_minutes' => 0
    ]);
    exit;
}

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

    if (($now - $time_curr) > 7200) continue; 

    $dist = haversineDistance($lat_prev, $lng_prev, $lat_curr, $lng_curr);

    if ($dist > 0 && $time_diff_hours > 0) {
        $speed = $dist / $time_diff_hours;
        if ($speed > 120) continue; 

        $last_moving_speed = $speed;
        $weight = $i;
        $total_distance += $dist * $weight;
        $total_time += $time_diff_hours * $weight;
        $valid_points++;
    }
}

$avg_speed_kmh = ($total_time > 0) ? ($total_distance / $total_time) : $last_moving_speed;
if ($avg_speed_kmh <= 0) $avg_speed_kmh = 10; 

$status = "Active";
$latest_record_time = strtotime(end($gps_points)['recorded_at']);
$time_diff_since_last = time() - $latest_record_time;

if ($time_diff_since_last > 1800) { 
    $status = "Inactive";
} elseif ($time_diff_since_last > 900) {
    $status = "Stale GPS signal";
}


$stop_duration_minutes = 0;
$recent_points_stmt = $conn->prepare("
    SELECT lat, lng, recorded_at 
    FROM gps_coordinates 
    WHERE device_id=? 
    ORDER BY recorded_at DESC 
    LIMIT 5
");
$recent_points_stmt->bind_param("s", $device_id);
$recent_points_stmt->execute();
$recent_result = $recent_points_stmt->get_result();

$recent_points = [];
while ($row = $recent_result->fetch_assoc()) {
    $recent_points[] = $row;
}
$recent_points_stmt->close();

if (count($recent_points) >= 2) {
    $moved = false;
    $first_time = strtotime(end($recent_points)['recorded_at']);
    $latest_time = strtotime($recent_points[0]['recorded_at']);

    for ($i = 1; $i < count($recent_points); $i++) {
        $dist = haversineDistance(
            $recent_points[$i - 1]['lat'],
            $recent_points[$i - 1]['lng'],
            $recent_points[$i]['lat'],
            $recent_points[$i]['lng']
        );
        if ($dist > 0.01) {
            $moved = true;
            break;
        }
    }

    if (!$moved) {
        $stop_duration_minutes = round(($latest_time - $first_time) / 60);
    }
}


$shipout_stmt = $conn->prepare("
    SELECT shipout_at 
    FROM Transactions 
    WHERE assigned_device_id = ? 
    ORDER BY shipout_at DESC 
    LIMIT 1
");
$shipout_stmt->bind_param("s", $device_id);
$shipout_stmt->execute();
$shipout_result = $shipout_stmt->get_result();
$shipout_time = time();

if ($shipout_row = $shipout_result->fetch_assoc()) {
    $shipout_time = strtotime($shipout_row['shipout_at']);
}
$shipout_stmt->close();


$eta_hours = $distance_to_customer_km / max($avg_speed_kmh, 5);
$eta_seconds = $eta_hours * 3600;


$eta_timestamp = time() + $eta_seconds;


if ($eta_timestamp < time()) {
    $eta_timestamp = time() + 300;
}


if (($eta_timestamp - time()) > 3600 * 12 && $distance_to_customer_km < 30) {
    $eta_timestamp = time() + 3600; 
}


$eta_timestamp = round($eta_timestamp / 300) * 300;

if ($distance_to_customer_km <= 0.2) {
    $eta = "Arrived";
} else {
    $eta_minutes = ceil($eta_seconds / 60);
    $eta = "Expected to arrive in {$eta_minutes} min" . ($eta_minutes > 1 ? "s" : "");
}



echo json_encode([
    'avg_speed_kmh' => round($avg_speed_kmh, 2),
    'distance_to_customer_km' => round($distance_to_customer_km, 2),
    'eta' => $eta,
    'status' => $status,
    'valid_points_used' => $valid_points,
    'stop_duration_minutes' => $stop_duration_minutes
]);
?>
