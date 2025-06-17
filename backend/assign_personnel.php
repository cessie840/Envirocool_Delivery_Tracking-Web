<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Content-Type: application/json");
error_reporting(E_ALL);
ini_set('display_errors', 1);

include 'database.php';

$data = json_decode(file_get_contents("php://input"), true);
$transactionId = $data['orderId'];
$personnelUsername = $data['personnelUsername'];

$insert = $conn->prepare("INSERT INTO DeliveryAssignments (transaction_id, personnel_username) VALUES (?, ?)");
$insert->bind_param("is", $transactionId, $personnelUsername);
$insertSuccess = $insert->execute();

$update = $conn->prepare("UPDATE DeliveryPersonnel SET assignment_status = 'Assigned', assigned_transaction_id = ? WHERE pers_username = ?");
$update->bind_param("is", $transactionId, $personnelUsername);
$updateSuccess = $update->execute();

if ($insertSuccess && $updateSuccess) {
    echo json_encode(["message" => "Assignment successful"]);
} else {
    http_response_code(500);
    echo json_encode(["message" => "Assignment failed"]);
}
?>
