<?php
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'database.php'; // your DB connection

// Get only Delivered, Cancelled, Out for Delivery
$sql = "
    SELECT 
        transaction_id, 
        customer_name, 
        DATE_FORMAT(date_of_order, '%b %d, %Y') AS date_ordered,
        status 
    FROM Transactions
    WHERE status IN ('Delivered', 'Cancelled', 'Out for Delivery')
    ORDER BY created_at DESC
    LIMIT 5
";

$result = $conn->query($sql);

$transactions = [];

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $transactions[] = [
            "transaction_id" => $row['transaction_id'],
            "customer_name"  => $row['customer_name'],
            "date_ordered"   => $row['date_ordered'],
            "status"         => $row['status']
        ];
    }
    echo json_encode([
        "success" => true,
        "transactions" => $transactions
    ]);
} else {
    echo json_encode([
        "success" => true,
        "transactions" => []
    ]);
}

$conn->close();
?>
