<?php
include 'database.php';

$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174', 'https://cessie840.github.io'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$sql = "
    SELECT 
   
        t.transaction_id,
        t.tracking_number,
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
