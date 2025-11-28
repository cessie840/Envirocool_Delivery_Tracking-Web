<?php
require_once "database.php";

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Expanded query so React has full QBE filter data
$sql = "
    SELECT 
        t.transaction_id,
        t.tracking_number,
        t.customer_name,
        t.customer_address,
        t.customer_contact,
        t.mode_of_payment,
        t.payment_option,
        t.total,
        t.balance,
        t.status AS delivery_status,
        p.description,
        p.quantity,
        p.type_of_product,
        p.unit_cost,
        t.date_of_order,
        t.target_date_delivery
    FROM Transactions t
    INNER JOIN PurchaseOrder p 
        ON t.transaction_id = p.transaction_id
    ORDER BY t.transaction_id DESC
";

$result = $conn->query($sql);

$rows = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }
}

echo json_encode($rows);
$conn->close();
?>
