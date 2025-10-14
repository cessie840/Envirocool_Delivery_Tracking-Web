<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
require 'database.php';

$sql = "
    SELECT 
        t.transaction_id,
        t.customer_name,
        t.date_of_order,
        t.status AS delivery_status,
        t.customer_rating
    FROM Transactions t
    ORDER BY t.date_of_order DESC
";

$result = $conn->query($sql);
$data = [];

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $data[] = [
            'transaction_id' => $row['transaction_id'],
            'customer_name' => $row['customer_name'],
            'date_of_order' => $row['date_of_order'],
            'delivery_status' => $row['delivery_status'],
            'customer_rating' => $row['customer_rating'] !== null ? (float)$row['customer_rating'] : null
        ];
    }
}

echo json_encode(['ratings' => $data]);
$conn->close();
?>
