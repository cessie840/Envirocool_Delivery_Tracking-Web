<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

include 'database.php';

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->orderId) || !isset($data->personnelUsername)) {
    echo json_encode(["success" => false, "message" => "Missing required fields."]);
    exit;
}

$orderId = intval($data->orderId);
$personnelUsername = $conn->real_escape_string($data->personnelUsername);


$checkSql = "SELECT assignment_id FROM DeliveryAssignments WHERE transaction_id = ?";
$checkStmt = $conn->prepare($checkSql);
$checkStmt->bind_param("i", $orderId);
$checkStmt->execute();
$checkStmt->store_result();

if ($checkStmt->num_rows > 0) {
    // Already assigned - reject
    echo json_encode([
        "success" => false,
        "message" => "This order already has a delivery personnel assigned."
    ]);
    $checkStmt->close();
    $conn->close();
    exit;
}

// Proceed to insert new assignment
$insertSql = "INSERT INTO DeliveryAssignments (transaction_id, personnel_username) VALUES (?, ?)";
$insertStmt = $conn->prepare($insertSql);
$insertStmt->bind_param("is", $orderId, $personnelUsername);
$success = $insertStmt->execute();

$insertStmt->close();
$checkStmt->close();
$conn->close();

echo json_encode([
    "success" => $success,
    "message" => $success ? "Personnel assigned successfully." : "Failed to assign personnel."
]);
