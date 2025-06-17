<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include 'database.php';

$sql = "
    SELECT 
        t.transaction_id,
        t.customer_name,
        po.description,
        po.quantity,
        t.total,
        IFNULL(dd.delivery_status, 'Pending') AS delivery_status
    FROM Transactions t
    INNER JOIN PurchaseOrder po ON t.transaction_id = po.transaction_id
    LEFT JOIN DeliveryDetails dd ON dd.transaction_id = t.transaction_id AND dd.po_id = po.po_id
    ORDER BY t.transaction_id DESC
";

$result = $conn->query($sql);

$deliveries = [];

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $deliveries[] = $row;
    }
}

echo json_encode($deliveries);
$conn->close();
