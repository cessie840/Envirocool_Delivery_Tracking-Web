<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Credentials: true");
require 'Database.php';

$period = $_GET['period'] ?? 'monthly';
$start = $_GET['start'] ?? null;
$end = $_GET['end'] ?? null;

if (!$start || !$end) {
    $today = new DateTime();

    switch ($period) {
        case 'daily':
            $startDate = $today->format('Y-m-d');
            $endDate = $startDate;
            break;
        case 'weekly':
            $weekStart = clone $today;
            $weekStart->modify('monday this week');
            $weekEnd = clone $weekStart;
            $weekEnd->modify('sunday this week');
            $startDate = $weekStart->format('Y-m-d');
            $endDate = $weekEnd->format('Y-m-d');
            break;
        case 'monthly':
            $startDate = $today->format('Y-m-01');
            $endDate = $today->format('Y-m-t');
            break;
        case 'quarterly':
            $month = (int)$today->format('m');
            $quarter = floor(($month - 1) / 3) + 1;
            $startMonth = ($quarter - 1) * 3 + 1;
            $startDateObj = new DateTime($today->format('Y') . "-$startMonth-01");
            $endDateObj = clone $startDateObj;
            $endDateObj->modify('+2 months');
            $endDateObj->modify('last day of this month');
            $startDate = $startDateObj->format('Y-m-d');
            $endDate = $endDateObj->format('Y-m-d');
            break;
        case 'annually':
            $startDate = $today->format('Y-01-01');
            $endDate = $today->format('Y-12-31');
            break;
        default:
            $startDate = $today->format('Y-m-01');
            $endDate = $today->format('Y-m-t');
    }
} else {
    $startDate = $start;
    $endDate = $end;
}

$whereClause = "";
$params = [];
$types = "";

if ($start && $end) {
    $whereClause = "AND DATE(t.date_of_order) BETWEEN ? AND ?";
    $params = [$startDate, $endDate];
    $types = "ss";
}

// Sales data query with payment fields
$sql = "
SELECT
    t.transaction_id,
    DATE(t.date_of_order) AS date_of_order,
    t.customer_name,
    po.type_of_product AS product_name,
    po.description AS item_name,
    po.quantity AS qty,
    po.unit_cost,
    po.total_cost,
    t.payment_option,
    t.down_payment,
    t.balance
FROM Transactions t
JOIN PurchaseOrder po ON t.transaction_id = po.transaction_id
WHERE t.status = 'Delivered' $whereClause
ORDER BY t.date_of_order ASC
";

$stmt = $conn->prepare($sql);
if (!$stmt) { echo json_encode(["error" => $conn->error]); exit; }
if ($types) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$result = $stmt->get_result();
$sales = $result->fetch_all(MYSQLI_ASSOC);
$stmt->close();

// Top selling items (no change needed here)
$sqlTop = "
SELECT
    po.description AS item_name,
    SUM(po.quantity) AS quantity_sold
FROM Transactions t
JOIN PurchaseOrder po ON t.transaction_id = po.transaction_id
WHERE t.status = 'Delivered' $whereClause
GROUP BY po.description
ORDER BY quantity_sold DESC
LIMIT 10
";
$stmtTop = $conn->prepare($sqlTop);
if ($types) {
    $stmtTop->bind_param($types, ...$params);
}
$stmtTop->execute();
$resultTop = $stmtTop->get_result();
$topSelling = $resultTop->fetch_all(MYSQLI_ASSOC);
$stmtTop->close();

// Summary with payment fields added
$sqlSummary = "
SELECT
    COUNT(DISTINCT t.transaction_id) AS total_transactions,
    COUNT(DISTINCT t.customer_name) AS total_customers,
    SUM(po.quantity) AS total_items_sold,
    SUM(po.total_cost) AS total_sales,
    SUM(t.down_payment) AS total_down_payment,
    SUM(t.balance) AS total_balance
FROM Transactions t
JOIN PurchaseOrder po ON t.transaction_id = po.transaction_id
WHERE t.status = 'Delivered' $whereClause
";

$stmtSum = $conn->prepare($sqlSummary);
if ($types) {
    $stmtSum->bind_param($types, ...$params);
}
$stmtSum->execute();
$resultSum = $stmtSum->get_result();
$summary = $resultSum->fetch_assoc();
$stmtSum->close();

echo json_encode([
    "sales" => $sales,
    "topSelling" => $topSelling,
    "summary" => $summary
]);
?>