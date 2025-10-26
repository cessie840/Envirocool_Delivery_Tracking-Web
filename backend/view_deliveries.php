<?php
// CORS headers
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type, Cache-Control, Pragma, Expires");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Credentials: true");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");
header("Content-Type: application/json");

// Handle preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'database.php';

$transaction_id = isset($_GET['transaction_id']) ? intval($_GET['transaction_id']) : 0;
if ($transaction_id <= 0) {
    echo json_encode(["error" => "Invalid transaction ID"]);
    exit;
}

// Base URL for file paths
$baseUrl = "http://localhost/DeliveryTrackingSystem/";
function buildFileUrl($baseUrl, $path) {
    if (!$path) return null;
    $path = ltrim($path, '/');
    return $baseUrl . '/' . str_replace('\\', '/', $path);
}

// 🧩 Fetch transaction details — include full_payment and fbilling_date
$sql_customer = "
    SELECT tracking_number, customer_name, customer_address, customer_contact, 
           date_of_order, target_date_delivery, rescheduled_date, 
           mode_of_payment, payment_option, 
           down_payment, full_payment, fbilling_date, balance, total, 
           status, cancelled_reason, proof_of_delivery, proof_of_payment
    FROM Transactions 
    WHERE transaction_id = ?
";

$stmt = $conn->prepare($sql_customer);
$stmt->bind_param("i", $transaction_id);
$stmt->execute();
$result_customer = $stmt->get_result();

if ($result_customer->num_rows > 0) {
    $customer = $result_customer->fetch_assoc();

    // Build proof URLs
    $proofOfDeliveryUrl = buildFileUrl($baseUrl, $customer['proof_of_delivery']);
    $proofOfPaymentUrl  = buildFileUrl($baseUrl, $customer['proof_of_payment']);

    // 🧠 Return all payment fields, including final payment and date
    $response = [
        'tracking_number' => $customer['tracking_number'],
        'customer_name' => $customer['customer_name'],
        'customer_address' => $customer['customer_address'],
        'customer_contact' => $customer['customer_contact'],
        'date_of_order' => $customer['date_of_order'],
        'target_date_delivery' => $customer['target_date_delivery'],
        'rescheduled_date' => $customer['rescheduled_date'],
        'mode_of_payment' => $customer['mode_of_payment'],
        'payment_option' => $customer['payment_option'],
        'down_payment' => $customer['down_payment'],
        'full_payment' => $customer['full_payment'],       // ✅ added
        'fbilling_date' => $customer['fbilling_date'],     // ✅ added
        'balance' => $customer['balance'],
        'total' => $customer['total'],
        'status' => $customer['status'],
        'cancelled_reason' => $customer['cancelled_reason'],
        'proof_of_delivery' => $proofOfDeliveryUrl,
        'proof_of_payment' => $proofOfPaymentUrl,
    ];

    // Fetch order items
    $sql_items = "
        SELECT type_of_product, description, quantity, unit_cost 
        FROM PurchaseOrder 
        WHERE transaction_id = ?
    ";
    $stmt_items = $conn->prepare($sql_items);
    $stmt_items->bind_param("i", $transaction_id);
    $stmt_items->execute();
    $result_items = $stmt_items->get_result();

    $items = [];
    while ($row = $result_items->fetch_assoc()) {
        $items[] = [
            "type_of_product" => $row['type_of_product'],
            "description" => $row['description'],
            "quantity" => $row['quantity'],
            "unit_cost" => $row['unit_cost']
        ];
    }

    $response['items'] = $items;

    echo json_encode($response);

    $stmt_items->close();
    $stmt->close();
} else {
    echo json_encode(["error" => "Transaction not found"]);
}

$conn->close();
?>
