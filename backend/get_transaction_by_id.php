<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

$allowed_origins = [
  "http://localhost:5173",
  "https://cessie840.github.io",
  "http://localhost:5173/Envirocool-Tracking-Page"
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
    header("Access-Control-Allow-Credentials: true");
} else {
    header("Access-Control-Allow-Origin: http://localhost:5173");
    header("Access-Control-Allow-Credentials: true");
}

header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

include "database.php";

if (!isset($_GET['transaction_id'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing transaction_id"]);
    exit;
}

$transaction_id = intval($_GET['transaction_id']);

$stmt = $conn->prepare("
    SELECT 
        transaction_id,
        tracking_number,
        customer_name,
        customer_address,
        customer_contact,
        date_of_order,
        target_date_delivery,
        mode_of_payment AS payment_method,
        payment_option,
        full_payment,
        fbilling_date AS fp_collection_date,
        down_payment,
        dbilling_date AS dp_collection_date,
        balance,
        total,
    FROM Transactions
    WHERE transaction_id = ?
");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(["error" => "Database prepare failed", "details" => $conn->error]);
    exit();
}

$stmt->bind_param("i", $transaction_id);
$stmt->execute();
$res = $stmt->get_result();
$form = $res->fetch_assoc();
$stmt->close();

if (!$form) {
    http_response_code(404);
    echo json_encode(["error" => "Transaction not found"]);
    exit;
}

$addressParts = explode(',', $form['customer_address']);
$form['house_no'] = trim($addressParts[0] ?? '');
$form['street_name'] = trim($addressParts[1] ?? '');
$form['barangay'] = trim($addressParts[2] ?? '');
$form['city'] = trim($addressParts[3] ?? '');

$stmt2 = $conn->prepare("
    SELECT type_of_product, description, quantity, unit_cost,
           (quantity * unit_cost) AS total_cost
    FROM PurchaseOrder
    WHERE transaction_id = ?
");
$stmt2->bind_param("i", $transaction_id);
$stmt2->execute();
$result2 = $stmt2->get_result();

$order_items = [];
while ($row = $result2->fetch_assoc()) {
    $order_items[] = $row;
}
$stmt2->close();

echo json_encode([
    "form" => $form,
    "order_items" => $order_items
]);

$conn->close();
?>
