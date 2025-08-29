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

// Sales data query
$sql = "
SELECT 
    DATE(t.date_of_order) AS date,
    t.customer_name,
    po.description AS item_name,
    po.quantity AS qty,
    po.unit_cost,
    po.total_cost
FROM Transactions t
JOIN PurchaseOrder po ON t.transaction_id = po.transaction_id
WHERE DATE(t.date_of_order) BETWEEN ? AND ?
ORDER BY t.date_of_order ASC
";

$stmt = $conn->prepare($sql);
if (!$stmt) { echo json_encode(["error" => $conn->error]); exit; }
$stmt->bind_param('ss', $startDate, $endDate);
$stmt->execute();
$result = $stmt->get_result();
$sales = $result->fetch_all(MYSQLI_ASSOC);
$stmt->close();

// Top selling items
$sqlTop = "
SELECT 
    po.description AS item_name,
    SUM(po.quantity) AS quantity_sold
FROM Transactions t
JOIN PurchaseOrder po ON t.transaction_id = po.transaction_id
WHERE DATE(t.date_of_order) BETWEEN ? AND ?
GROUP BY po.description
ORDER BY quantity_sold DESC
LIMIT 10
";
$stmtTop = $conn->prepare($sqlTop);
$stmtTop->bind_param('ss', $startDate, $endDate);
$stmtTop->execute();
$resultTop = $stmtTop->get_result();
$topSelling = $resultTop->fetch_all(MYSQLI_ASSOC);
$stmtTop->close();

// Summary
$sqlSummary = "
SELECT 
    COUNT(DISTINCT t.transaction_id) AS total_transactions,
    COUNT(DISTINCT t.customer_name) AS total_customers,
    SUM(po.quantity) AS total_items_sold,
    SUM(po.total_cost) AS total_sales
FROM Transactions t
JOIN PurchaseOrder po ON t.transaction_id = po.transaction_id
WHERE DATE(t.date_of_order) BETWEEN ? AND ?
";
$stmtSum = $conn->prepare($sqlSummary);
$stmtSum->bind_param('ss', $startDate, $endDate);
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
