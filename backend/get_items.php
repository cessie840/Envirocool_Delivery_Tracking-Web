<?php
include 'database.php';

$allowed_origins = [
    "https://cessie840.github.io",
    "http://localhost:5173",
    "http://localhost:5173/add-delivery", 'https://envirocool-delivery-tracking-web.vercel.app/'
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

$sql = "SELECT type_of_product, description, unit_cost 
        FROM Product 
        ORDER BY type_of_product ASC, description ASC";

$result = $conn->query($sql);

$grouped = [];
while ($row = $result->fetch_assoc()) {
    $type = $row['type_of_product'];

    if (!isset($grouped[$type])) {
        $grouped[$type] = [];
    }

    $grouped[$type][] = [
        "label" => $row['description'],
        "value" => $row['description'],
        "unit_cost" => floatval($row['unit_cost']) 
    ];
}

echo json_encode($grouped);
$conn->close();
?>