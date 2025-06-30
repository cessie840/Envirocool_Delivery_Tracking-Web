<?php
include 'database.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['transaction_id'])) {
    echo json_encode(["status" => "error", "message" => "Missing data"]);
    exit;
}

$transaction_id = $data['transaction_id'];
$customer_name = $data['customer_name'];
$customer_address = $data['customer_address'];
$customer_contact = $data['customer_contact'];
$mode_of_payment = $data['mode_of_payment'];
$down_payment = (float)($data['down_payment'] ?? 0);
$items = $data['items'] ?? [];

$conn->begin_transaction();

try {
    $total = 0;
    foreach ($items as $item) {
        $total += $item['quantity'] * $item['unit_cost'];
    }

    $balance = $total - $down_payment;

    $updateTrans = $conn->prepare("UPDATE Transactions SET customer_name=?, customer_address=?, customer_contact=?, mode_of_payment=?, total=?, down_payment=?, balance=? WHERE transaction_id=?");
    $updateTrans->bind_param("ssssdddi", $customer_name, $customer_address, $customer_contact, $mode_of_payment, $total, $down_payment, $balance, $transaction_id);
    $updateTrans->execute();

    foreach ($items as $item) {
        $description = $item['description'];
        $quantity = (int)$item['quantity'];
        $unit_cost = (float)$item['unit_cost'];
        $total_cost = $quantity * $unit_cost;

        $updateItem = $conn->prepare("UPDATE PurchaseOrder SET quantity=?, unit_cost=?, total_cost=? WHERE transaction_id=? AND description=?");
        $updateItem->bind_param("iddis", $quantity, $unit_cost, $total_cost, $transaction_id, $description);
        $updateItem->execute();
    }

    $conn->commit();
    echo json_encode(["status" => "success"]);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
