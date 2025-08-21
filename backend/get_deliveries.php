<?php
require_once "database.php";

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$sql = "
    SELECT 
        t.transaction_id,
        t.customer_name,
        t.total,
        t.status AS delivery_status, 
        p.description,
        p.quantity
    FROM Transactions t
    INNER JOIN PurchaseOrder p ON t.transaction_id = p.transaction_id
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
?>
