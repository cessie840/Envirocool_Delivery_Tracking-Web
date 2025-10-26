<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Cache-Control, Pragma, Expires");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Cache-Control: no-cache, no-store, must-revalidate"); // Prevent server caching
header("Pragma: no-cache");
header("Expires: 0");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'database.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['transaction_id'])) {
    error_log("Missing data in payload");
    echo json_encode(["status" => "error", "message" => "Missing data"]);
    exit;
}

$transaction_id       = $data['transaction_id'];
$customer_name        = trim($data['customer_name'] ?? '');
$customer_address     = trim($data['customer_address'] ?? '');
$customer_contact     = trim($data['customer_contact'] ?? '');
$date_of_order        = $data['date_of_order'] ?? null;
$target_date_delivery = $data['target_date_delivery'] ?? null;
$mode_of_payment      = $data['mode_of_payment'] ?? '';
$payment_option       = $data['payment_option'] ?? '';
$down_payment         = is_numeric($data['down_payment']) ? (float)$data['down_payment'] : 0;
$full_payment         = is_numeric($data['full_payment']) ? (float)$data['full_payment'] : 0;
$fbilling_date        = $data['fbilling_date'] ?? null;
$items                = $data['items'] ?? [];

// Basic validation
if (empty($customer_name) || empty($customer_address) || empty($customer_contact) || empty($mode_of_payment) || empty($payment_option)) {
    echo json_encode(["status" => "error", "message" => "Required fields are missing"]);
    exit;
}
if (!preg_match('/^09\d{9}$/', $customer_contact)) {
    echo json_encode(["status" => "error", "message" => "Invalid contact number"]);
    exit;
}
if (empty($items)) {
    echo json_encode(["status" => "error", "message" => "At least one item is required"]);
    exit;
}
foreach ($items as $item) {
    if (!isset($item['quantity']) || $item['quantity'] < 1 || !isset($item['unit_cost']) || $item['unit_cost'] < 0 || empty($item['type_of_product']) || empty($item['description'])) {
        echo json_encode(["status" => "error", "message" => "Invalid item data"]);
        exit;
    }
}

error_log("Received payload: " . json_encode($data));

$conn->begin_transaction();

try {
    // Calculate total from items
    $total = 0;
    foreach ($items as $item) {
        $total += ((float)$item['unit_cost']) * ((int)$item['quantity']);
    }
    $balance = $total - $down_payment - $full_payment; // Recalculate balance

    error_log("Calculated: total=$total, down_payment=$down_payment, full_payment=$full_payment, balance=$balance");

    // Update Transactions table
    $stmt = $conn->prepare("
        UPDATE Transactions 
        SET customer_name=?, customer_address=?, customer_contact=?, 
            date_of_order=?, target_date_delivery=?, 
            mode_of_payment=?, payment_option=?, 
            down_payment=?, balance=?, total=?, 
            full_payment=?, fbilling_date=? 
        WHERE transaction_id=?
    ");
    $stmt->bind_param(
        "sssssssddddsi",
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
        $full_payment,
        $fbilling_date,
        $transaction_id
    );
    if (!$stmt->execute()) {
        error_log("Transactions update failed: " . $stmt->error);
        throw new Exception("Transactions update failed: " . $stmt->error);
    }
    if ($stmt->affected_rows === 0) {
        throw new Exception("No rows updated in Transactions—check if transaction_id exists");
    }
    $stmt->close();

    error_log("Transactions table updated successfully");

    // Delete all existing items for this transaction_id
    $deleteStmt = $conn->prepare("DELETE FROM PurchaseOrder WHERE transaction_id=?");
    $deleteStmt->bind_param("i", $transaction_id);
    if (!$deleteStmt->execute()) {
        error_log("Delete items failed: " . $deleteStmt->error);
        throw new Exception("Delete items failed: " . $deleteStmt->error);
    }
    $deleteStmt->close();

    // Insert all new items
    $insertStmt = $conn->prepare("INSERT INTO PurchaseOrder (transaction_id, quantity, type_of_product, description, unit_cost) VALUES (?, ?, ?, ?, ?)");
    foreach ($items as $item) {
        $quantity = (int)$item['quantity'];
        $type_of_product = trim($item['type_of_product']);
        $description = trim($item['description']);
        $unit_cost = (float)$item['unit_cost'];

        $insertStmt->bind_param("iissd", $transaction_id, $quantity, $type_of_product, $description, $unit_cost);
        if (!$insertStmt->execute()) {
            error_log("Insert item failed: " . $insertStmt->error);
            throw new Exception("Insert item failed: " . $insertStmt->error);
        }
    }
    $insertStmt->close();

    $conn->commit();
    error_log("Commit successful");
    echo json_encode(["status" => "success", "message" => "Order updated successfully"]);
} catch (Exception $e) {
    $conn->rollback();
    error_log("Error: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>