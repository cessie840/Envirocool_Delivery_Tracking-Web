<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include 'database.php';

$response = [];


$transactionQuery = "SELECT MAX(transaction_id) AS latest_transaction_id FROM Transactions";
$transactionResult = mysqli_query($conn, $transactionQuery);

if ($transactionRow = mysqli_fetch_assoc($transactionResult)) {
    $latestTransactionId = $transactionRow['latest_transaction_id'];
    $response['transaction_id'] = $latestTransactionId ? $latestTransactionId + 1 : 4001;
} else {
    $response['transaction_id'] = 4001;
}


$poQuery = "SELECT MAX(po_id) AS latest_po_id FROM PurchaseOrder";
$poResult = mysqli_query($conn, $poQuery);

if ($poRow = mysqli_fetch_assoc($poResult)) {
    $latestPoId = $poRow['latest_po_id'];
    $nextPoId = $latestPoId ? $latestPoId + 1 : 1;

    $response['po_id'] = str_pad($nextPoId, 4, "0", STR_PAD_LEFT);
} else {
    $response['po_id'] = "0001";
}


echo json_encode($response);
