<?php
include 'database.php';

$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174', 'https://cessie840.github.io','https://envirocool-delivery-tracking-web.vercel.app'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

header("Access-Control-Allow-Headers: Content-Type, Cache-Control, Pragma, Expires");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data || !isset($data['transaction_id'])) {
        throw new Exception("Missing transaction ID in payload.");
    }

    $transaction_id       = (int)$data['transaction_id'];
    $customer_name        = trim($data['customer_name'] ?? '');
    $customer_address     = trim($data['customer_address'] ?? '');
    $customer_contact     = trim($data['customer_contact'] ?? '');
    $date_of_order        = $data['date_of_order'] ?? null;
    $target_date_delivery = $data['target_date_delivery'] ?? null;
    $mode_of_payment      = $data['mode_of_payment'] ?? '';
    $payment_option       = $data['payment_option'] ?? '';
    $down_payment         = is_numeric($data['down_payment'] ?? null) ? (float)$data['down_payment'] : 0;
    $new_payment_amount   = is_numeric($data['full_payment'] ?? null) ? (float)$data['full_payment'] : 0;
    $fbilling_date        = $data['fbilling_date'] ?? date('Y-m-d');
    $items                = $data['items'] ?? [];

    if (
        empty($customer_name) || empty($customer_address) || empty($customer_contact) ||
        empty($mode_of_payment) || empty($payment_option)
    ) {
        throw new Exception("Required fields are missing.");
    }

    if (!preg_match('/^09\d{9}$/', $customer_contact)) {
        throw new Exception("Invalid contact number format.");
    }

    if (empty($items)) {
        throw new Exception("At least one item is required.");
    }

    foreach ($items as $item) {
        if (
            !isset($item['quantity']) || $item['quantity'] < 1 ||
            !isset($item['unit_cost']) || $item['unit_cost'] < 0 ||
            empty($item['type_of_product']) || empty($item['description'])
        ) {
            throw new Exception("Invalid item data.");
        }
    }

    $conn->begin_transaction();

    $total = 0;
    foreach ($items as $item) {
        $total += ((float)$item['unit_cost']) * ((int)$item['quantity']);
    }

    $existingQuery = $conn->prepare("SELECT payments, down_payment FROM Transactions WHERE transaction_id = ?");
    $existingQuery->bind_param("i", $transaction_id);
    $existingQuery->execute();
    $existingResult = $existingQuery->get_result()->fetch_assoc();
    $existingQuery->close();

    $payments = json_decode($existingResult['payments'] ?? '[]', true);
    if (!is_array($payments)) $payments = [];

    if ($new_payment_amount > 0) {
        $payments[] = [
            "label" => "Additional Payment",
            "amount" => $new_payment_amount,
            "date" => $fbilling_date
        ];
    }

    $total_paid = $down_payment;
    foreach ($payments as $p) {
        $total_paid += (float)$p['amount'];
    }

    $balance = $total - $total_paid;
    $payment_status = ($balance <= 0) ? 'Fully Paid' : 'Partially Paid';

    $payments_json = json_encode($payments, JSON_UNESCAPED_UNICODE);

    $sql = "
        UPDATE Transactions 
        SET 
            customer_name = ?, 
            customer_address = ?, 
            customer_contact = ?, 
            date_of_order = ?, 
            target_date_delivery = ?, 
            mode_of_payment = ?, 
            payment_option = ?, 
            down_payment = ?, 
            balance = ?, 
            total = ?, 
            fbilling_date = ?, 
            payment_status = ?, 
            payments = ?
        WHERE transaction_id = ?
    ";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }

    $stmt->bind_param(
        "sssssssdddsssi",
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
        $fbilling_date,
        $payment_status,
        $payments_json,
        $transaction_id
    );

    if (!$stmt->execute()) {
        throw new Exception("Update failed: " . $stmt->error);
    }
    $stmt->close();

    $deleteStmt = $conn->prepare("DELETE FROM PurchaseOrder WHERE transaction_id=?");
    $deleteStmt->bind_param("i", $transaction_id);
    $deleteStmt->execute();
    $deleteStmt->close();

    $insertStmt = $conn->prepare("
        INSERT INTO PurchaseOrder (transaction_id, quantity, type_of_product, description, unit_cost)
        VALUES (?, ?, ?, ?, ?)
    ");
    foreach ($items as $item) {
        $quantity = (int)$item['quantity'];
        $type_of_product = trim($item['type_of_product']);
        $description = trim($item['description']);
        $unit_cost = (float)$item['unit_cost'];
        $insertStmt->bind_param("iissd", $transaction_id, $quantity, $type_of_product, $description, $unit_cost);
        $insertStmt->execute();
    }
    $insertStmt->close();

    $conn->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Order updated successfully",
        "payment_status" => $payment_status,
        "payments" => $payments
    ]);

} catch (Exception $e) {
    if (isset($conn)) {
        $conn->rollback();
    }
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?>