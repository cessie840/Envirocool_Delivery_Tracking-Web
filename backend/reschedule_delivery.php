<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once "database.php";

if ($_SERVER['REQUEST_METHOD'] === "OPTIONS") {
    http_response_code(200);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$transaction_id = isset($data["transaction_id"]) ? intval($data["transaction_id"]) : null;
$new_date = isset($data["rescheduled_date"]) ? $data["rescheduled_date"] : null;

if (!$transaction_id || !$new_date) {
    echo json_encode(["success" => false, "message" => "Missing transaction_id or rescheduled_date"]);
    exit;
}

// ✅ Update transaction: set new target date, mark as "Pending" again
$sql = $conn->prepare("
    UPDATE Transactions
    SET status = 'Pending', 
        target_date_delivery = ?, 
        rescheduled_date = NOW(),
        cancelled_reason = NULL,
        cancelled_at = NULL
    WHERE transaction_id = ?
");
$sql->bind_param("si", $new_date, $transaction_id);

if ($sql->execute()) {
    echo json_encode(["success" => true, "message" => "Delivery successfully rescheduled"]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to reschedule delivery"]);
}

$sql->close();
$conn->close();
?>
