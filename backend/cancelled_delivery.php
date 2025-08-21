<?php
header("Access-Control-Allow-Origin: http://localhost:5173"); 
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once "database.php"; 

if ($_SERVER['REQUEST_METHOD'] === "OPTIONS") {
    http_response_code(200);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$transaction_id = isset($data["transaction_id"]) ? intval($data["transaction_id"]) : null;
$reason         = isset($data["reason"]) ? trim($data["reason"]) : null;

if (!$transaction_id || empty($reason)) {
    echo json_encode([
        "success" => false,
        "message" => "Missing required fields (transaction_id or reason)."
    ]);
    exit;
}

$check = $conn->prepare("SELECT * FROM Transactions WHERE transaction_id = ?");
$check->bind_param("i", $transaction_id);
$check->execute();
$result = $check->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Transaction not found."
    ]);
    exit;
}

$update = $conn->prepare("UPDATE Transactions 
                          SET status = 'Cancelled', cancel_reason = ? 
                          WHERE transaction_id = ?");
$update->bind_param("si", $reason, $transaction_id);

if (!$update->execute()) {
    echo json_encode([
        "success" => false,
        "message" => "Failed to update transaction.",
        "error_detail" => $conn->error
    ]);
    exit;
}

$insert = $conn->prepare("INSERT INTO CancelledDeliveries (transaction_id, cancelled_reason) 
                          VALUES (?, ?)");
$insert->bind_param("is", $transaction_id, $reason);

if ($insert->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Delivery successfully cancelled.",
        "transaction_id" => $transaction_id,
        "reason" => $reason
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Failed to record cancelled delivery.",
        "error_detail" => $conn->error
    ]);
}

$update->close();
$insert->close();
$conn->close();
?>
