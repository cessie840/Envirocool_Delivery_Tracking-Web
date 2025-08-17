<?php
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: http://localhost:5173");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    http_response_code(200);
    exit();
}

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

include 'database.php';

$data = json_decode(file_get_contents("php://input"), true);
$transactionId = isset($data['transaction_id']) ? intval($data['transaction_id']) : 0;

if ($transactionId <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid transaction ID"]);
    exit;
}

// ✅ Start transaction
$conn->begin_transaction();

try {
    // Update main transaction status
    $sql1 = "UPDATE Transactions SET status = 'Out for Delivery' WHERE transaction_id = ?";
    $stmt1 = $conn->prepare($sql1);
    $stmt1->bind_param("i", $transactionId);
    $stmt1->execute();

    if ($stmt1->affected_rows <= 0) {
        throw new Exception("Failed to update transaction status.");
    }

    // Update DeliveryDetails status for all items in this transaction
    $sql2 = "UPDATE DeliveryDetails SET delivery_status = 'Out for Delivery' WHERE transaction_id = ?";
    $stmt2 = $conn->prepare($sql2);
    $stmt2->bind_param("i", $transactionId);
    $stmt2->execute();

    // Commit
    $conn->commit();

    echo json_encode(["success" => true, "message" => "Transaction marked as Out for Delivery"]);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}

$conn->close();
?>
