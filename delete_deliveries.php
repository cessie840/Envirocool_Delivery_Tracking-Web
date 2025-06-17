<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

include 'database.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['transaction_id'])) {
    http_response_code(400);
    echo json_encode(["error" => "Transaction ID is required"]);
    exit();
}

$transaction_id = $data['transaction_id'];

$stmt = $conn->prepare("DELETE FROM Transactions WHERE transaction_id = ?");
$stmt->bind_param("i", $transaction_id);

if ($stmt->execute()) {
    echo json_encode(["status" => "success"]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Failed to delete transaction"]);
}

$conn->close();
