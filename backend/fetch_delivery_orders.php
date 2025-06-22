<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Content-Type: application/json");
include 'database.php';

$orders = [];
$sql = "SELECT t.*, 
               da.personnel_username, 
               CONCAT(dp.pers_fname, ' ', dp.pers_lname) AS assigned_personnel
        FROM Transactions t
        LEFT JOIN DeliveryAssignments da ON t.transaction_id = da.transaction_id
        LEFT JOIN DeliveryPersonnel dp ON da.personnel_username = dp.pers_username";

$result = $conn->query($sql);

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $transactionId = $row['transaction_id'];

        $itemsSql = "SELECT quantity, description, unit_cost, (quantity * unit_cost) AS total_cost
                     FROM PurchaseOrder 
                     WHERE transaction_id = $transactionId";
        $itemsResult = $conn->query($itemsSql);

        $items = [];
        $calculatedTotal = 0;

        if ($itemsResult && $itemsResult->num_rows > 0) {
            while ($item = $itemsResult->fetch_assoc()) {
                $itemTotal = $item['total_cost'];
                $calculatedTotal += $itemTotal;

                $items[] = [
                    'name' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_cost' => number_format($item['unit_cost'], 2),
                    'price' => number_format($itemTotal, 2)
                ];
            }
        }

        $orders[] = [
            'transaction_no' => $transactionId,
            'customer_name' => $row['customer_name'],
            'customer_address' => $row['customer_address'],
            'contact_number' => $row['customer_contact'],
            'payment_mode' => $row['mode_of_payment'],
            'down_payment' => number_format($row['down_payment'], 2),
            'balance' => number_format($row['balance'], 2),
            'total_cost' => number_format($calculatedTotal, 2),
            'items' => $items,
            'assigned_personnel' => $row['assigned_personnel'] ?? null  // null if not assigned
        ];
    }
}

echo json_encode($orders);
$conn->close();
