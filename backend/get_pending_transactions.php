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

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'database.php'; 

$totalTransactions = 0;

$totalQuery = "
    SELECT COUNT(*) AS total 
    FROM Transactions
    WHERE status = 'Pending'
";
$totalResult = $conn->query($totalQuery);

if ($totalResult && $totalResult->num_rows > 0) {
    $row = $totalResult->fetch_assoc();
    $totalTransactions = (int)$row['total'];
}

$sql = "
    SELECT 
        transaction_id, 
        customer_name, 
        DATE_FORMAT(date_of_order, '%b %d, %Y') AS date_ordered,
        status 
    FROM Transactions
    WHERE status = 'Pending'
    ORDER BY created_at DESC
    LIMIT 10
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
}

echo json_encode([
    "success" => true,
    "transactions" => $transactions,
    "total" => $totalTransactions
]);

$conn->close();
?>
