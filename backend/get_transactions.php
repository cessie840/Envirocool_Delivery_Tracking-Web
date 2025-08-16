<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json");

require_once "database.php";

$type = isset($_GET['type']) ? $_GET['type'] : 'monthly';

$where = "1=1";
if ($type === 'daily') {
  $where = "DATE(t.date_of_order) = CURDATE()";
} else {
  $where = "DATE_FORMAT(t.date_of_order, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')";
}

$sql = "
SELECT
  t.transaction_id,
  t.date_of_order,
  t.customer_name,
  po.description AS item_name,
  po.quantity AS item_quantity,
  t.total,
  t.status
FROM Transactions t
JOIN PurchaseOrder po ON po.transaction_id = t.transaction_id
WHERE $where
ORDER BY t.date_of_order DESC, t.transaction_id DESC, po.po_id ASC";

$res = $conn->query($sql);
$out = [];
if ($res) {
  while ($row = $res->fetch_assoc()) {
    $row['total'] = (float)$row['total'];
    $out[] = $row;
  }
}

header('Content-Type: application/json');
echo json_encode($out);
