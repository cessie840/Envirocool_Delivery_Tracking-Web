<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

// Handle preflight requests
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
