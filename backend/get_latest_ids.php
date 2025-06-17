<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include 'database.php';

$response = [];


$transactionQuery = "SELECT MAX(transaction_id) AS latest_transaction_id FROM Transactions";
$transactionResult = mysqli_query($conn, $transactionQuery);

if ($transactionRow = mysqli_fetch_assoc($transactionResult)) {
    $latestTransactionId = $transactionRow['latest_transaction_id'];
    $response['transaction_id'] = $latestTransactionId ? $latestTransactionId + 1 : 100001;
} else {
    $response['transaction_id'] = 100001;
}


$poQuery = "SELECT MAX(po_id) AS latest_po_id FROM PurchaseOrder";
$poResult = mysqli_query($conn, $poQuery);

if ($poRow = mysqli_fetch_assoc($poResult)) {
    $latestPoId = $poRow['latest_po_id'];
    $response['po_id'] = $latestPoId ? $latestPoId + 1 : 500001;
} else {
    $response['po_id'] = 500001;
}

echo json_encode($response);
