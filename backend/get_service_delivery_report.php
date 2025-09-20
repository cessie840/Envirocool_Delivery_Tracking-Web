<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
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
            $month = (int) $today->format('m');
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

// Fetch base transactions
$sql = "
SELECT 
    t.transaction_id,
    t.date_of_order AS date_of_order,
    t.customer_name,
    po.description AS item_name,
    po.quantity, 
    COALESCE(dd.delivery_status, t.status) AS delivery_status,
    t.target_date_delivery,
    t.rescheduled_date,
    t.cancelled_reason
FROM Transactions t
JOIN PurchaseOrder po ON t.transaction_id = po.transaction_id
LEFT JOIN DeliveryDetails dd ON t.transaction_id = dd.transaction_id
WHERE t.date_of_order BETWEEN ? AND ?
ORDER BY t.date_of_order ASC";


$stmt = $conn->prepare($sql);
$stmt->bind_param('ss', $startDate, $endDate);
$stmt->execute();
$result = $stmt->get_result();
$serviceDeliveries = $result->fetch_all(MYSQLI_ASSOC);
$stmt->close();


foreach ($serviceDeliveries as &$delivery) {
    $historySql = "
        SELECT event_type, reason, event_timestamp
        FROM DeliveryHistory
        WHERE transaction_id = ?
        ORDER BY event_timestamp ASC
    ";
    $stmtHist = $conn->prepare($historySql);
    $stmtHist->bind_param('i', $delivery['transaction_id']);
    $stmtHist->execute();
    $historyResult = $stmtHist->get_result();
    $history = $historyResult->fetch_all(MYSQLI_ASSOC);
    $stmtHist->close();

    $delivery['history'] = $history;

    // 🔹 Cancellation reason: last one from history or Transactions
    $cancelledArray = array_filter($history, fn($h) => $h['event_type'] === 'Cancelled' && !empty($h['reason']));
    $lastCancel = !empty($cancelledArray) ? end($cancelledArray) : null;
    $delivery['cancelled_reason'] = $lastCancel['reason'] ?? $delivery['cancelled_reason'];

    // 🔹 Last rescheduled date (from history if available)
    $rescheduledArray = array_filter($history, fn($h) => $h['event_type'] === 'Rescheduled' && !empty($h['reason']));
    $lastReschedule = !empty($rescheduledArray) ? end($rescheduledArray) : null;

    // Keep DB's rescheduled_date field, but prefer last reschedule in history if present
    $delivery['rescheduled_date'] = $lastReschedule['reason'] ?? $delivery['rescheduled_date'];

    // 🔹 Make explicit: original vs rescheduled
    $delivery['original_target_date'] = $delivery['target_date_delivery'];
    $delivery['latest_rescheduled_date'] = $delivery['rescheduled_date'];
}

// Summary (totals)
$sqlSummary = "
SELECT 
    COUNT(DISTINCT t.transaction_id) AS total_transactions,
    COUNT(DISTINCT t.customer_name) AS total_customers,
    SUM(po.quantity) AS total_items_sold,
    SUM(po.total_cost) AS total_sales,
    SUM(CASE WHEN COALESCE(dd.delivery_status, t.status) = 'Delivered' THEN 1 ELSE 0 END) AS successful_deliveries,
    (
        SELECT COUNT(*) 
        FROM DeliveryHistory dh
        WHERE dh.event_type = 'Cancelled'
        AND dh.event_timestamp BETWEEN ? AND ?
    ) AS failed_deliveries
FROM Transactions t
JOIN PurchaseOrder po ON t.transaction_id = po.transaction_id
LEFT JOIN DeliveryDetails dd ON t.transaction_id = dd.transaction_id
WHERE DATE(t.date_of_order) BETWEEN ? AND ?
";
$stmtSum = $conn->prepare($sqlSummary);
$stmtSum->bind_param('ssss', $startDate, $endDate, $startDate, $endDate);
$stmtSum->execute();
$resultSum = $stmtSum->get_result();
$summary = $resultSum->fetch_assoc();
$stmtSum->close();

// 🔹 Aggregate cancellation reasons history (for charts)
// Failed reasons grouped
$sqlReasons = "
    SELECT reason, COUNT(*) as count
    FROM DeliveryHistory
    WHERE event_type = 'Cancelled'
    AND event_timestamp BETWEEN ? AND ?
    GROUP BY reason
";
$stmtReasons = $conn->prepare($sqlReasons);
$stmtReasons->bind_param('ss', $startDate, $endDate);
$stmtReasons->execute();
$resultReasons = $stmtReasons->get_result();
$failedReasons = [];
while ($row = $resultReasons->fetch_assoc()) {
    $failedReasons[$row['reason']] = (int) $row['count'];
}
$stmtReasons->close();

echo json_encode([
    "serviceDeliveries" => $serviceDeliveries,
    "summary" => $summary,
    "failedReasons" => $failedReasons
]);
?>