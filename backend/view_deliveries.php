<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include 'database.php';

$transaction_id = isset($_GET['transaction_id']) ? intval($_GET['transaction_id']) : 0;

$response = [];

$sql_customer = "
    SELECT tracking_number, customer_name, customer_address, customer_contact, 
           date_of_order, target_date_delivery, rescheduled_date, mode_of_payment, payment_option, 
           down_payment, balance, total, status, cancelled_reason, proof_of_delivery
    FROM Transactions 
    WHERE transaction_id = ?
";
$stmt = $conn->prepare($sql_customer);
$stmt->bind_param("i", $transaction_id);
$stmt->execute();
$result_customer = $stmt->get_result();

if ($result_customer->num_rows > 0) {
    $customer = $result_customer->fetch_assoc();

    // Define the base URL for your server
$baseUrl = "http://localhost/DeliveryTrackingSystem/";


  $proofPath = $customer['proof_of_delivery'];
if ($proofPath) {
    // If DB already has full URL, just use it
    if (preg_match('/^https?:\/\//', $proofPath)) {
        $proofUrl = $proofPath;
    } else {
        // Otherwise, build full URL
        $proofPath = ltrim($proofPath, '/');
        $dirname = dirname($proofPath);
        $basename = basename($proofPath);
        $proofUrl = $baseUrl . $dirname . "/" . rawurlencode($basename);
    }
} else {
    $proofUrl = null;
}

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
    'balance' => $customer['balance'],
    'total' => $customer['total'],
    'status' => $customer['status'],
    'cancelled_reason' => $customer['cancelled_reason'],
    'proof_of_delivery' => $proofUrl,
];


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
} else {
    echo json_encode(["error" => "Transaction not found"]);
}

$conn->close();
?>
