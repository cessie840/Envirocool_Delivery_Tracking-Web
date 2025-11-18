<?php
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174', 'https://cessie840.github.io'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "database.php";

$type = isset($_GET['type']) ? $_GET['type'] : 'monthly';
$date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
$month = isset($_GET['date']) ? $_GET['date'] : date('Y-m');

$where = "1=1";
$params = [];
$types = "";

if ($type === 'daily') {
  $where = "DATE(t.date_of_order) = ?";
  $params[] = $date;
  $types .= "s";
} else {
  $where = "DATE_FORMAT(t.date_of_order, '%Y-%m') = ?";
  $params[] = $month;
  $types .= "s";
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

$stmt = $conn->prepare($sql);
if (!empty($params)) {
  $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$res = $stmt->get_result();

$out = [];
if ($res) {
  while ($row = $res->fetch_assoc()) {
    $row['total'] = (float)$row['total'];
    $out[] = $row;
  }
}
$stmt->close();

echo json_encode($out);
