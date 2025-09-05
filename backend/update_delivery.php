<?php
include 'database.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

// Get POST data
$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['transaction_id'])) {
    echo json_encode(["status" => "error", "message" => "Missing data"]);
    exit;
}

$transaction_id       = $data['transaction_id'];
$customer_name        = $data['customer_name'] ?? '';
$customer_address     = $data['customer_address'] ?? '';
$customer_contact     = $data['customer_contact'] ?? '';
$date_of_order        = $data['date_of_order'] ?? null;
$target_date_delivery = $data['target_date_delivery'] ?? null;
$mode_of_payment      = $data['mode_of_payment'] ?? '';
$payment_option       = $data['payment_option'] ?? '';
$down_payment         = (float)($data['down_payment'] ?? 0);
$items                = $data['items'] ?? [];

$conn->begin_transaction();

try {
    // Recalculate total and balance
    $total = 0;
    foreach ($items as $item) {
        $total += $item['quantity'] * $item['unit_cost'];
    }
    $balance = $total - $down_payment;

    // Update Transactions table
    $stmtTrans = $conn->prepare("
        UPDATE Transactions 
        SET customer_name=?, customer_address=?, customer_contact=?, 
            date_of_order=?, target_date_delivery=?, 
            mode_of_payment=?, payment_option=?, 
            total=?, down_payment=?, balance=? 
        WHERE transaction_id=?
    ");
    $stmtTrans->bind_param(
        "sssssssdddi",
        $customer_name,
        $customer_address,
        $customer_contact,
        $date_of_order,
        $target_date_delivery,
        $mode_of_payment,
        $payment_option,
        $total,
        $down_payment,
        $balance,
        $transaction_id
    );
    $stmtTrans->execute();

    // Update or Insert each item in PurchaseOrder
    foreach ($items as $item) {
        $type_of_product = $item['type_of_product'] ?? '';
        $description     = $item['description'] ?? '';
        $quantity        = (int)$item['quantity'];
        $unit_cost       = (float)$item['unit_cost'];

        // Check if item exists
        $checkStmt = $conn->prepare("
            SELECT COUNT(*) as count 
            FROM PurchaseOrder 
            WHERE transaction_id=? AND description=?
        ");
        $checkStmt->bind_param("is", $transaction_id, $description);
        $checkStmt->execute();
        $res = $checkStmt->get_result()->fetch_assoc();

        if ($res['count'] > 0) {
            // Update existing item
            $updateItem = $conn->prepare("
                UPDATE PurchaseOrder 
                SET type_of_product=?, quantity=?, unit_cost=? 
                WHERE transaction_id=? AND description=?
            ");
            $updateItem->bind_param(
                "sidis",
                $type_of_product,
                $quantity,
                $unit_cost,
                $transaction_id,
                $description
            );
            $updateItem->execute();
        } else {
            // Insert new item
            $insertItem = $conn->prepare("
                INSERT INTO PurchaseOrder (transaction_id, type_of_product, description, quantity, unit_cost)
                VALUES (?, ?, ?, ?, ?)
            ");
            $insertItem->bind_param(
                "issid",
                $transaction_id,
                $type_of_product,
                $description,
                $quantity,
                $unit_cost
            );
            $insertItem->execute();
        }
    }

    $conn->commit();
    echo json_encode(["status" => "success"]);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
