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

// Get selected or current year
$year = isset($_GET['year']) ? (int)$_GET['year'] : date("Y");

// ✅ Fetch all transactions with their latest event type if any
$sql = "
    SELECT 
        t.transaction_id,
        t.customer_name,
        t.date_of_order,
        COALESCE(
            (
                SELECT dh.event_type 
                FROM DeliveryHistory dh
                WHERE dh.transaction_id = t.transaction_id
                ORDER BY dh.event_timestamp DESC 
                LIMIT 1
            ), 
            t.status
        ) AS final_status
    FROM Transactions t
    WHERE YEAR(t.date_of_order) = ?
    ORDER BY t.date_of_order ASC
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $year);
$stmt->execute();
$result = $stmt->get_result();

// Initialize monthly counts
$months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
$monthlyCounts = [];

foreach ($months as $m) {
    $monthlyCounts[$m] = [
        "month" => $m,
        "total" => 0,
        "successful" => 0,
        "cancelled" => 0
    ];
}

// ✅ Process transactions
while ($row = $result->fetch_assoc()) {
    $month = date("M", strtotime($row['date_of_order']));
    $status = strtolower(trim($row['final_status']));

    if (!isset($monthlyCounts[$month])) continue;

    $monthlyCounts[$month]["total"] += 1;

    // ✅ Check if ever cancelled (even if later rescheduled)
    $cancelCheckSql = "
        SELECT EXISTS(
            SELECT 1 FROM DeliveryHistory dh
            WHERE dh.transaction_id = ?
            AND LOWER(dh.event_type) = 'cancelled'
        ) AS was_cancelled
    ";
    $cancelCheck = $conn->prepare($cancelCheckSql);
    $cancelCheck->bind_param("i", $row['transaction_id']);
    $cancelCheck->execute();
    $cancelResult = $cancelCheck->get_result()->fetch_assoc();
    $wasCancelled = (bool) $cancelResult['was_cancelled'];
    $cancelCheck->close();

    // ✅ Categorize transactions
    if ($status === "delivered" || $status === "completed") {
        $monthlyCounts[$month]["successful"] += 1;
    } elseif ($status === "cancelled" || $wasCancelled) {
        $monthlyCounts[$month]["cancelled"] += 1;
    }
}

// Convert to simple array for frontend
$data = array_values($monthlyCounts);

// ✅ Output JSON
echo json_encode([
    "success" => true,
    "year" => $year,
    "monthly" => $data
]);

$stmt->close();
$conn->close();
?>
