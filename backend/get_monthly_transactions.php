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

// Current year
$year = isset($_GET['year']) ? (int)$_GET['year'] : date("Y");

// Fetch all transactions for the year
$sql = "
    SELECT 
        transaction_id, 
        customer_name, 
        date_of_order,
        status 
    FROM Transactions
    WHERE status IN ('To Ship', 'Out for Delivery', 'Delivered', 'Cancelled')
      AND YEAR(date_of_order) = ?
    ORDER BY date_of_order ASC
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $year);
$stmt->execute();
$result = $stmt->get_result();

// Initialize monthly counts (total, successful, cancelled)
$months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
$monthlyCounts = [];
foreach ($months as $m) {
    $monthlyCounts[$m] = [
        "total" => 0,
        "successful" => 0,
        "cancelled" => 0
    ];
}

// Process transactions
while ($row = $result->fetch_assoc()) {
    $month = date("M", strtotime($row['date_of_order'])); // e.g. "Jan"
    if (isset($monthlyCounts[$month])) {
        // Count all valid transactions
        $monthlyCounts[$month]["total"] += 1;

        if ($row['status'] === "Delivered") {
            $monthlyCounts[$month]["successful"] += 1;
        } elseif ($row['status'] === "Cancelled") {
            $monthlyCounts[$month]["cancelled"] += 1;
        }
    }
}

// Build final response array
$data = [];
foreach ($months as $m) {
    $data[] = [
        "month" => $m,
        "total" => $monthlyCounts[$m]["total"],
        "successful" => $monthlyCounts[$m]["successful"],
        "cancelled" => $monthlyCounts[$m]["cancelled"]
    ];
}

echo json_encode([
    "success" => true,
    "year" => $year,
    "monthly" => $data
]);

$conn->close();
?>
