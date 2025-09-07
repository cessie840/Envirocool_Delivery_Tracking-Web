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

// Get current year (or use ?year=2025 from query params)
$year = isset($_GET['year']) ? (int)$_GET['year'] : date("Y");

// Initialize counts
$successful = 0;
$cancelled = 0;
$total = 0;

// Query Successful transactions
$sql_success = "
    SELECT COUNT(*) AS total 
    FROM Transactions
    WHERE status = 'Delivered' 
    AND YEAR(date_of_order) = ?
";
$stmt = $conn->prepare($sql_success);
$stmt->bind_param("i", $year);
$stmt->execute();
$result = $stmt->get_result()->fetch_assoc();
$successful = (int)($result['total'] ?? 0);

// Query Cancelled transactions
$sql_cancelled = "
    SELECT COUNT(*) AS total 
    FROM Transactions
    WHERE status = 'Cancelled' 
    AND YEAR(date_of_order) = ?
";
$stmt = $conn->prepare($sql_cancelled);
$stmt->bind_param("i", $year);
$stmt->execute();
$result = $stmt->get_result()->fetch_assoc();
$cancelled = (int)($result['total'] ?? 0);

// Total
$total = $successful + $cancelled;

// Return JSON response
echo json_encode([
    "success" => true,
    "year" => $year,
    "total" => $total,
    "distribution" => [
        ["name" => "Successful", "value" => $successful],
        ["name" => "Cancelled", "value" => $cancelled]
    ]
]);

$conn->close();
?>
