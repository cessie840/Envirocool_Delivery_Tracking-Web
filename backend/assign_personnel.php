<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Content-Type: application/json");
include 'database.php';

$data = json_decode(file_get_contents("php://input"));

$orderId = $conn->real_escape_string($data->orderId);
$personnelUsername = $conn->real_escape_string($data->personnelUsername);

$sql = "UPDATE DeliveryOrders 
        SET assigned_to = '$personnelUsername', status = 'assigned' 
        WHERE transaction_no = '$orderId'";

if ($conn->query($sql)) {
    echo json_encode(["status" => "success"]);
} else {
    echo json_encode(["status" => "error", "message" => $conn->error]);
}
?>
