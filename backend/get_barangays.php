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

$city = $_GET['city'] ?? '';
$province = $_GET['province'] ?? '';

if (!$city || !$province) {
    echo json_encode([]);
    exit;
}

$query = "SELECT DISTINCT barangay_name FROM location WHERE province_name = ? AND city_name = ? ORDER BY barangay_name ASC";
$stmt = $conn->prepare($query);
$stmt->bind_param("ss", $province, $city);
$stmt->execute();
$result = $stmt->get_result();

$barangays = [];
while ($row = $result->fetch_assoc()) {
    $barangays[] = [
        "label" => $row['barangay_name'],
        "value" => $row['barangay_name']
    ];
}

echo json_encode($barangays);
$stmt->close();
$conn->close();
?>
