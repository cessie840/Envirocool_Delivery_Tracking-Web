<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Credentials: true");
require 'database.php';

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

$whereClause = "";
$params = [];
$types = "";

if ($start && $end) {
    $whereClause = "WHERE DATE(t.date_of_order) BETWEEN ? AND ?";
    $params = [$startDate, $endDate];
    $types = "ss";
}

$sql = "
SELECT
    t.transaction_id,
    t.tracking_number,
    t.customer_name,
    t.customer_address,
    t.customer_contact,
    t.date_of_order,
    Choose rescheduled_date if exists, else target_date_delivery
    COALESCE(t.rescheduled_date, t.target_date_delivery) AS shipout_at,
    po.type_of_product AS product_name,
    po.description AS item_name,
    po.quantity AS qty,
    po.unit_cost,
    (po.quantity * po.unit_cost) AS subtotal,
    t.mode_of_payment,
    t.payment_option,
    t.down_payment,
    t.balance,
    t.status AS delivery_status,
    CONCAT(dp.pers_fname, ' ', dp.pers_lname) AS delivery_personnel,
    t.completed_at,
    t.cancelled_reason
FROM Transactions t
JOIN PurchaseOrder po ON t.transaction_id = po.transaction_id
LEFT JOIN DeliveryAssignments da ON t.transaction_id = da.transaction_id
LEFT JOIN DeliveryPersonnel dp ON da.personnel_username = dp.pers_username
$whereClause
ORDER BY t.date_of_order ASC
";

$stmt = $conn->prepare($sql);
if ($types) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$result = $stmt->get_result();
$transactions = $result->fetch_all(MYSQLI_ASSOC);
$stmt->close();

$sqlSummary = "
SELECT
    COUNT(DISTINCT t.transaction_id) AS total_transactions,
    COUNT(DISTINCT t.customer_name) AS total_customers,
    SUM(po.quantity) AS total_items_sold,
    SUM(po.quantity * po.unit_cost) AS total_sales,
    SUM(CASE WHEN LOWER(t.status) = 'delivered' THEN 1 ELSE 0 END) AS successful_deliveries,
    SUM(CASE WHEN LOWER(t.status) = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_deliveries
FROM Transactions t
JOIN PurchaseOrder po ON t.transaction_id = po.transaction_id
$whereClause
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
    "transactions" => $transactions,
    "summary" => $summary
]);
?>