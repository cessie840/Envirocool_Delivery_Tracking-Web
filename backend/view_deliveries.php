<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include 'database.php';

$transaction_id = $_GET['transaction_id'];

$response = [];

$sql_customer = "SELECT tracking_number, customer_name, customer_address, customer_contact, date_of_order, target_date_delivery, mode_of_payment, payment_option, down_payment, balance, total 
                 FROM Transactions WHERE transaction_id = ?";
$stmt = $conn->prepare($sql_customer);
$stmt->bind_param("i", $transaction_id);
$stmt->execute();
$result_customer = $stmt->get_result();

if ($result_customer->num_rows > 0) {
    $customer = $result_customer->fetch_assoc();

    $response['tracking_number'] = $customer['tracking_number'];
    $response['customer_name'] = $customer['customer_name'];
    $response['customer_address'] = $customer['customer_address'];
    $response['customer_contact'] = $customer['customer_contact'];
    $response['date_of_order'] = $customer['date_of_order'];
    $response['target_date_delivery'] = $customer['target_date_delivery'];
    $response['mode_of_payment'] = $customer['mode_of_payment'];
    $response['payment_option'] = $customer['payment_option'];
    $response['down_payment'] = $customer['down_payment'];
    $response['balance'] = $customer['balance'];
    $response['total'] = $customer['total'];

    $sql_items = "SELECT description, quantity, unit_cost FROM PurchaseOrder WHERE transaction_id = ?";
    $stmt_items = $conn->prepare($sql_items);
    $stmt_items->bind_param("i", $transaction_id);
    $stmt_items->execute();
    $result_items = $stmt_items->get_result();

    $items = [];
    while ($row = $result_items->fetch_assoc()) {
        $items[] = $row;
    }

    $response['items'] = $items;

    echo json_encode($response);
} else {
    echo json_encode(["error" => "Transaction not found"]);
}

$conn->close();
