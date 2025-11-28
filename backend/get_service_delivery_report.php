<?php
header("Content-Type: application/json");
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174', 'https://cessie840.github.io','https://envirocool-delivery-tracking-web.vercel.app'
];
if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
require 'database.php';

$period = $_GET['period'] ?? 'monthly';
$start = $_GET['start'] ?? null;
$end = $_GET['end'] ?? null;

// Compute startDate/endDate
if (empty($start) || empty($end)) {
    $today = new DateTime();
    switch ($period) {
        case 'daily':
            $startDate = $today->format('Y-m-d');
            $endDate = $startDate;
            break;
        case 'weekly':
            $endDateObj = clone $today;
            $startDateObj = clone $today;
            $startDateObj->modify('-6 days');
            $startDate = $startDateObj->format('Y-m-d');
            $endDate = $endDateObj->format('Y-m-d');
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

$whereClauseForMain = "";
$whereClauseForAppending = "";
$params = [];
$types = "";
if (!empty($startDate) && !empty($endDate)) {
    $whereClauseForMain = "WHERE DATE(t.date_of_order) BETWEEN ? AND ?";
    $whereClauseForAppending = " AND DATE(t.date_of_order) BETWEEN ? AND ?";
    $params = [$startDate, $endDate];
    $types = "ss";
}

$sql = "
SELECT
    t.transaction_id,
    DATE(t.date_of_order) AS date_of_order,
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
" . $whereClauseForMain . "
ORDER BY t.date_of_order ASC";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo json_encode(["error" => $conn->error]);
    exit;
}
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

    $cancelledArray = array_filter($history, fn($h) => $h['event_type'] === 'Cancelled' && !empty($h['reason']));
    $lastCancel = !empty($cancelledArray) ? end($cancelledArray) : null;
    $delivery['cancelled_reason'] = $lastCancel['reason'] ?? $delivery['cancelled_reason'];

    $rescheduledArray = array_filter($history, fn($h) => $h['event_type'] === 'Rescheduled' && !empty($h['reason']));
    $lastReschedule = !empty($rescheduledArray) ? end($rescheduledArray) : null;
    $delivery['rescheduled_date'] = $lastReschedule['reason'] ?? $delivery['rescheduled_date'];

    $delivery['original_target_date'] = $delivery['target_date_delivery'];
    $delivery['latest_rescheduled_date'] = $delivery['rescheduled_date'];
}

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
        WHERE dh.event_type = 'Cancelled'" .
        ($types ? " AND DATE(dh.event_timestamp) BETWEEN ? AND ?" : "") . "
    ) AS failed_deliveries
FROM Transactions t
JOIN PurchaseOrder po ON t.transaction_id = po.transaction_id
LEFT JOIN DeliveryDetails dd ON t.transaction_id = dd.transaction_id
" . $whereClauseForMain . "
";

$stmtSum = $conn->prepare($sqlSummary);
if (!$stmtSum) {
    echo json_encode(["error" => $conn->error]);
    exit;
}
if ($types) {
    $bindParams = array_merge($params, $params);
    $bindTypes = $types . $types;
    $stmtSum->bind_param($bindTypes, ...$bindParams);
}
$stmtSum->execute();
$resultSum = $stmtSum->get_result();
$summary = $resultSum->fetch_assoc();
$stmtSum->close();

$sqlReasons = "
    SELECT
        SUM(CASE WHEN LOWER(reason) LIKE '%vehicle%' THEN 1 ELSE 0 END) AS vehicle_related,
        SUM(CASE WHEN LOWER(reason) LIKE '%location%' THEN 1 ELSE 0 END) AS location_inaccessible
    FROM DeliveryHistory
    WHERE event_type = 'Cancelled'" .
    ($types ? " AND DATE(event_timestamp) BETWEEN ? AND ?" : "") . "
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