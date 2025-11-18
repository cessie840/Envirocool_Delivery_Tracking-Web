<?php
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174', 'https://cessie840.github.io'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

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
