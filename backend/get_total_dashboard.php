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

include 'database.php'; 

// SQL query for totals
$sql = "
    SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END) AS successful,
        SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending
    FROM Transactions
";

$result = $conn->query($sql);

if ($result && $row = $result->fetch_assoc()) {
    echo json_encode([
        "success"    => true,
        "total"      => (int)$row['total'],
        "successful" => (int)$row['successful'],
        "cancelled"  => (int)$row['cancelled'],
        "pending"    => (int)$row['pending']
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Query failed"]);
}

$conn->close();
?>
