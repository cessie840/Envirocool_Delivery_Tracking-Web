<?php
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174', 'https://cessie840.github.io'
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

header("Content-Type: application/json");

require_once "database.php";

$sql = "SELECT item_name AS name, quantity_sold AS sales
        FROM TopSellingItems
        WHERE month = DATE_FORMAT(CURDATE(), '%Y-%m')
        ORDER BY sales DESC";
$res = $conn->query($sql);

$out = [];
if ($res) {
  while ($row = $res->fetch_assoc()) {
    $row['sales'] = (int)$row['sales'];
    $out[] = $row;
  }
}

header('Content-Type: application/json');
echo json_encode($out);
