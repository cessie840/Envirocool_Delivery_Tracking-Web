<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include 'database.php'; // database connection

$device_id = $_GET['device_id'] ?? '';
$distance_to_customer_km = floatval($_GET['distance_km'] ?? 0);

// Haversine function to calculate distance between 2 lat/lng points in km
function haversineDistance($lat1, $lon1, $lat2, $lon2) {
    $earthRadius = 6371; // km

    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);

    $a = sin($dLat/2) * sin($dLat/2) +
         cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
         sin($dLon/2) * sin($dLon/2);
    $c = 2 * atan2(sqrt($a), sqrt(1-$a));

    return $earthRadius * $c;
}

// Fetch recent GPS points (e.g., last 10 points)
$stmt = $conn->prepare("SELECT lat, lng, recorded_at FROM gps_coordinates WHERE device_id=? ORDER BY recorded_at DESC LIMIT 10");
$stmt->bind_param("s", $device_id);
$stmt->execute();
$result = $stmt->get_result();

$gps_points = [];
while($row = $result->fetch_assoc()){
    $gps_points[] = $row;
}

// Reverse array so oldest first
$gps_points = array_reverse($gps_points);

$total_distance = 0;
$total_time = 0;
$last_moving_speed = 0;

for($i=1; $i<count($gps_points); $i++){
    $lat_prev = $gps_points[$i-1]['lat'];
    $lng_prev = $gps_points[$i-1]['lng'];
    $lat_curr = $gps_points[$i]['lat'];
    $lng_curr = $gps_points[$i]['lng'];

    $time_prev = strtotime($gps_points[$i-1]['recorded_at']);
    $time_curr = strtotime($gps_points[$i]['recorded_at']);
    $time_diff_hours = ($time_curr - $time_prev)/3600;

    $dist = haversineDistance($lat_prev, $lng_prev, $lat_curr, $lng_curr);
    
    if($dist > 0 && $time_diff_hours > 0){
        $speed = $dist / $time_diff_hours;
        $last_moving_speed = $speed; // store last moving speed
        // Weight recent points more: weight = index (recent more)
        $weight = $i;
        $total_distance += $dist * $weight;
        $total_time += $time_diff_hours * $weight;
    }
}

// Weighted average speed
$avg_speed_kmh = ($total_time > 0) ? $total_distance / $total_time : $last_moving_speed;

// Fallback if still zero
if($avg_speed_kmh == 0){
    $avg_speed_kmh = 10; // assume minimal speed if totally idle
}

// ETA calculation
$eta_hours = $distance_to_customer_km / $avg_speed_kmh;
$eta_seconds = $eta_hours * 3600;
$eta_time = date('Y-m-d H:i:s', strtotime('now') + $eta_seconds);

echo json_encode([
    'avg_speed_kmh' => round($avg_speed_kmh, 2),
    'distance_to_customer_km' => $distance_to_customer_km,
    'eta' => $eta_time
]);
?>
