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

// ✅ Fetch unique provinces
$query = "SELECT DISTINCT province_name FROM location ORDER BY province_name ASC";
$result = $conn->query($query);

$provinces = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $provinces[] = [
            "label" => $row['province_name'],
            "value" => $row['province_name']
        ];
    }
}

echo json_encode($provinces);
$conn->close();
?>
