<?php
// ===== START OF FILE, NO SPACES BEFORE THIS TAG =====

// CORS headers
$allowed_origins = ['http://localhost:5173', 'http://localhost:5174'];
if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
}

header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include DB connection
include 'database.php';

// Initialize
$totalPending = 0;
$pendingTransactions = [];

// Get total pending transactions
$totalQuery = "SELECT COUNT(*) AS total FROM Transactions WHERE status = 'Pending'";
$totalResult = $conn->query($totalQuery);
if ($totalResult && $totalResult->num_rows > 0) {
    $row = $totalResult->fetch_assoc();
    $totalPending = (int)$row['total'];
}

// Get last 10 pending transactions
$sql = "
    SELECT 
        transaction_id, 
        customer_name, 
        DATE_FORMAT(date_of_order, '%b %d, %Y') AS date_ordered
    FROM Transactions
    WHERE status = 'Pending'
    ORDER BY created_at DESC
    LIMIT 10
";

$result = $conn->query($sql);
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $pendingTransactions[] = [
            "transaction_id" => $row['transaction_id'],
            "customer_name" => $row['customer_name'],
            "date_ordered" => $row['date_ordered'],
            "status" => "Pending"
        ];
    }
}

// Return JSON
echo json_encode([
    "success" => true,
    "transactions" => $pendingTransactions,
    "total" => $totalPending
]);

$conn->close();
exit(); // Ensure nothing else is output
?>
