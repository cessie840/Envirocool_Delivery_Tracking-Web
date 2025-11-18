<?php
include 'database.php';

$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174', 'https://cessie840.github.io/Envirocool_Delivery_Tracking-Web'
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

$sql = "SELECT DISTINCT type_of_product FROM Product ORDER BY type_of_product ASC";
$result = $conn->query($sql);

$types = [];
while ($row = $result->fetch_assoc()) {
    $types[] = [
        "label" => $row['type_of_product'],
        "value" => $row['type_of_product']
    ];
}

echo json_encode($types);
$conn->close();
?>
