<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Content-Type: application/json");
include 'database.php';

$sql = "SELECT * FROM DeliveryOrders WHERE status = 'pending'";
$result = $conn->query($sql);

$orders = [];

while ($row = $result->fetch_assoc()) {
$items = json_decode($row['items'], true);
$row['items'] = is_array($items) ? $items : [];
    $orders[] = $row;
}

echo json_encode($orders);
?>
