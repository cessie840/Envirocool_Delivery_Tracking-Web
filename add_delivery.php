<?php
// === CORS HEADERS FOR REACT FRONTEND ===
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

// === Handle Preflight Request ===
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

// === Include Database Connection ===
include 'database.php';

try {
    $data = json_decode(file_get_contents("php://input"), true);

    if (
        !isset($data['customer_name']) || !isset($data['customer_address']) || !isset($data['customer_contact']) ||
        !isset($data['date_of_order']) || !isset($data['mode_of_payment']) ||
        !isset($data['down_payment']) || !isset($data['balance']) || !isset($data['total']) ||
        !isset($data['order_items']) || !is_array($data['order_items'])
    ) {
        http_response_code(400);
        echo json_encode(["error" => "Missing required fields"]);
        exit();
    }

    $customer_name = $data['customer_name'];
    $customer_address = $data['customer_address'];
    $customer_contact = $data['customer_contact'];
    $date_of_order = $data['date_of_order'];
    $mode_of_payment = $data['mode_of_payment'];
    $down_payment = $data['down_payment'];
    $balance = $data['balance'];
    $total = $data['total'];
    $order_items = $data['order_items'];

    // === Insert Into Transactions ===
    $stmt = $conn->prepare("INSERT INTO Transactions (customer_name, customer_address, customer_contact, date_of_order, mode_of_payment, down_payment, balance, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssssss", $customer_name, $customer_address, $customer_contact, $date_of_order, $mode_of_payment, $down_payment, $balance, $total);

    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to insert transaction"]);
        exit();
    }

    $transaction_id = $stmt->insert_id;

    // === Prepare Insert for PurchaseOrder
    $stmt_po = $conn->prepare("INSERT INTO PurchaseOrder (transaction_id, quantity, description, unit_cost, total_cost) VALUES (?, ?, ?, ?, ?)");

    // === Prepare Insert for DeliveryDetails
    $stmt_dd = $conn->prepare("INSERT INTO DeliveryDetails (transaction_id, po_id, delivery_status) VALUES (?, ?, 'Pending')");

    foreach ($order_items as $item) {
        $quantity = $item['quantity'];
        $description = $item['description'];
        $unit_cost = $item['unit_cost'];
        $total_cost = $item['total_cost'];

        $stmt_po->bind_param("iisdd", $transaction_id, $quantity, $description, $unit_cost, $total_cost);

        if (!$stmt_po->execute()) {
            http_response_code(500);
            echo json_encode(["error" => "Failed to insert PO item"]);
            exit();
        }

        $po_id = $stmt_po->insert_id;

        // Insert into DeliveryDetails
        $stmt_dd->bind_param("ii", $transaction_id, $po_id);
        if (!$stmt_dd->execute()) {
            http_response_code(500);
            echo json_encode(["error" => "Failed to insert delivery details"]);
            exit();
        }
    }

    http_response_code(200);
    echo json_encode(["status" => "success", "transaction_id" => $transaction_id]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Server error", "details" => $e->getMessage()]);
}

$conn->close();
