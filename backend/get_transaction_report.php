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

$sql = "
SELECT 
    t.transaction_id,
    t.tracking_number,
    t.customer_name,
    t.customer_address,
    t.customer_contact,
    t.date_of_order,
    COALESCE(t.rescheduled_date, t.target_date_delivery) AS shipout_at,
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
WHERE DATE(t.date_of_order) BETWEEN ? AND ?
ORDER BY t.date_of_order ASC
";


$stmt = $conn->prepare($sql);
$stmt->bind_param('ss', $startDate, $endDate);
$stmt->execute();
$result = $stmt->get_result();
$transactions = $result->fetch_all(MYSQLI_ASSOC);
$stmt->close();

$sqlSummary = "
SELECT 
    COUNT(DISTINCT t.customer_name) AS total_customers,
    COUNT(DISTINCT t.transaction_id) AS total_transactions,
    SUM(po.quantity) AS total_items_sold,
    SUM(po.quantity * po.unit_cost) AS total_sales 
FROM Transactions t
JOIN (
    SELECT transaction_id, SUM(total_cost) AS total_per_transaction
    FROM PurchaseOrder
    GROUP BY transaction_id
) AS order_totals ON t.transaction_id = order_totals.transaction_id
JOIN PurchaseOrder po ON t.transaction_id = po.transaction_id
WHERE DATE(t.date_of_order) BETWEEN ? AND ?
";

$stmtSum = $conn->prepare($sqlSummary);
$stmtSum->bind_param('ssss', $startDate, $endDate, $startDate, $endDate);

$stmtSum->execute();
$resultSum = $stmtSum->get_result();
$summary = $resultSum->fetch_assoc();
$stmtSum->close();

echo json_encode([
    "transactions" => $transactions,
    "summary" => $summary
]);
?>