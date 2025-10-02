<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");    
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
require 'Database.php';

$period = $_GET['period'] ?? 'monthly';
$start = $_GET['start'] ?? null;
$end = $_GET['end'] ?? null;

$whereClause = "";
$params = [];
$types = "";

if ($start && $end) {
    $whereClause = "WHERE t.date_of_order BETWEEN ? AND ?";
    $params = [$startDate, $endDate];
    $types = "ss";
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
$whereClause
ORDER BY t.date_of_order ASC";


$stmt = $conn->prepare($sql);
if ($types) {
    $stmt->bind_param($types, ...$params);
}
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
    SUM(CASE WHEN LOWER(COALESCE(dd.delivery_status, t.status)) = 'delivered' THEN 1 ELSE 0 END) AS successful_deliveries,
    (
        SELECT COUNT(*)
        FROM DeliveryHistory dh
        WHERE dh.event_type = 'Cancelled'
        $whereClause
    ) AS failed_deliveries
FROM Transactions t
JOIN PurchaseOrder po ON t.transaction_id = po.transaction_id
LEFT JOIN DeliveryDetails dd ON t.transaction_id = dd.transaction_id
$whereClause
";
$stmtSum = $conn->prepare($sqlSummary);
if ($types) {
    $stmtSum->bind_param($types . $types, ...$params, ...$params);
}
$stmtSum->execute();
$resultSum = $stmtSum->get_result();
$summary = $resultSum->fetch_assoc();
$stmtSum->close();

// 🔹 Aggregate cancellation reasons history (for charts)
$sqlReasons = "
    SELECT
        SUM(CASE WHEN LOWER(reason) LIKE '%vehicle%' THEN 1 ELSE 0 END) AS vehicle_related,
        SUM(CASE WHEN LOWER(reason) LIKE '%location%' THEN 1 ELSE 0 END) AS location_inaccessible
    FROM DeliveryHistory
    WHERE event_type = 'Cancelled'
    $whereClause
";
$stmtReasons = $conn->prepare($sqlReasons);
if ($types) {
    $stmtReasons->bind_param($types, ...$params);
}
$stmtReasons->execute();
$resultReasons = $stmtReasons->get_result();
$row = $resultReasons->fetch_assoc();
$stmtReasons->close();

$failedReasons = [
    "Vehicle-related Issue" => (int) $row['vehicle_related'],
    "Location Inaccessible" => (int) $row['location_inaccessible'],
];


echo json_encode([
    "serviceDeliveries" => $serviceDeliveries,
    "summary" => $summary,
    "failedReasons" => $failedReasons
]);
?>