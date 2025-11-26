<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include "database.php";

$data = json_decode(file_get_contents("php://input"), true);
$transaction_id = $data["transaction_id"] ?? null;

if (!$transaction_id) {
    echo json_encode(["status" => "error", "message" => "Missing transaction ID"]);
    exit;
}

$select = $conn->prepare("SELECT balance FROM transactions WHERE transaction_id = ?");
$select->bind_param("s", $transaction_id);
$select->execute();
$result = $select->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["status" => "error", "message" => "Transaction not found"]);
    exit;
}

$row = $result->fetch_assoc();
$remaining_balance = floatval($row["balance"]);

if ($remaining_balance <= 0) {
    echo json_encode(["status" => "error", "message" => "No remaining balance to clear"]);
    exit;
}

$payment_date = date("Y-m-d");
$emptyProofs = json_encode([]);

$insert = $conn->prepare("
    INSERT INTO payment_history (transaction_id, amount, payment_date, proof_files)
    VALUES (?, ?, ?, ?)
");
$insert->bind_param("idss", $transaction_id, $remaining_balance, $payment_date, $emptyProofs);

if (!$insert->execute()) {
    echo json_encode(["status" => "error", "message" => "Failed to record payment history"]);
    exit;
}

$update = $conn->prepare("UPDATE transactions SET balance = 0 WHERE transaction_id = ?");
$update->bind_param("s", $transaction_id);
$update->execute();

echo json_encode(["status" => "success"]);
?>
