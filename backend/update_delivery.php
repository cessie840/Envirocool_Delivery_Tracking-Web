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
 
    $total = 0;
    foreach ($items as $item) {
        $total += ((float)$item['unit_cost']) * ((int)$item['quantity']);
    }
    $balance = $total - $down_payment;

   
    $stmt = $conn->prepare("
        UPDATE Transactions 
        SET customer_name=?, customer_address=?, customer_contact=?, 
            date_of_order=?, target_date_delivery=?, 
            mode_of_payment=?, payment_option=?, 
            down_payment=?, balance=?, total=? 
        WHERE transaction_id=?
    ");
    $stmt->bind_param(
        "sssssssdddi",
        $customer_name,
        $customer_address,
        $customer_contact,
        $date_of_order,
        $target_date_delivery,
        $mode_of_payment,
        $payment_option,
        $down_payment,
        $balance,
        $total,
        $transaction_id
    );
    $stmt->execute();
    $stmt->close();


    $existingItems = [];
    $result = $conn->query("SELECT po_id FROM PurchaseOrder WHERE transaction_id = " . intval($transaction_id) . " ORDER BY po_id ASC");
    while ($row = $result->fetch_assoc()) {
        $existingItems[] = $row['po_id'];
    }
    $existingCount = count($existingItems);
    $newCount = count($items);


    $limit = min($existingCount, $newCount);
    for ($i = 0; $i < $limit; $i++) {
        $po_id = $existingItems[$i];
        $item = $items[$i];

        $stmt = $conn->prepare("
            UPDATE PurchaseOrder 
            SET quantity=?, type_of_product=?, description=?, unit_cost=? 
            WHERE po_id=? AND transaction_id=?
        ");
        $stmt->bind_param(
            "issdii",
            $item['quantity'],
            $item['type_of_product'],
            $item['description'],
            $item['unit_cost'],
            $po_id,
            $transaction_id
        );
        $stmt->execute();
        $stmt->close();
    }

   
    if ($newCount < $existingCount) {
        $toDelete = array_slice($existingItems, $newCount);
        $ids = implode(",", array_map('intval', $toDelete));
        $conn->query("DELETE FROM PurchaseOrder WHERE po_id IN ($ids)");
    }

    if ($newCount > $existingCount) {
        $stmt = $conn->prepare("
            INSERT INTO PurchaseOrder (transaction_id, quantity, type_of_product, description, unit_cost) 
            VALUES (?, ?, ?, ?, ?)
        ");
        for ($i = $existingCount; $i < $newCount; $i++) {
            $item = $items[$i];
            $stmt->bind_param(
                "iissd",
                $transaction_id,
                $item['quantity'],
                $item['type_of_product'],
                $item['description'],
                $item['unit_cost']
            );
            $stmt->execute();
        }
        $stmt->close();
    }

    $conn->commit();
    echo json_encode(["status" => "success"]);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
