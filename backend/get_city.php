<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$allowed_origins = [
    "https://cessie840.github.io",
    "http://localhost:5173",
    "http://localhost:5173/Envirocool-Tracking-Page"
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include 'database.php';

$province = $_GET['province'] ?? '';

if (!$province) {
    echo json_encode([]);
    exit;
}

$query = "SELECT DISTINCT city_name FROM location WHERE province_name = ? ORDER BY city_name ASC";
$stmt = $conn->prepare($query);
$stmt->bind_param("s", $province);
$stmt->execute();
$result = $stmt->get_result();

$cities = [];
while ($row = $result->fetch_assoc()) {
    $cities[] = [
        "label" => $row['city_name'],
        "value" => $row['city_name']
    ];
}

echo json_encode($cities);
$stmt->close();
$conn->close();
?>
