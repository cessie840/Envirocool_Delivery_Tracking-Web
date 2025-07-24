<?php
// CORS headers for preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: http://localhost:5173");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    http_response_code(200);
    exit();
}

// CORS headers for actual request
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

include 'database.php';

$data = json_decode(file_get_contents("php://input"), true);
$username = isset($data['pers_username']) ? $conn->real_escape_string($data['pers_username']) : '';

if (empty($username)) {
    http_response_code(400);
    echo json_encode(["error" => "Username required"]);
    exit;
}

$sql = "
SELECT 
    t.transaction_id, t.customer_name, t.customer_address, t.customer_contact, t.mode_of_payment,
    po.quantity, po.description, po.unit_cost,
    (po.quantity * po.unit_cost) AS item_total
FROM DeliveryAssignments da
JOIN Transactions t ON da.transaction_id = t.transaction_id
JOIN PurchaseOrder po ON po.transaction_id = t.transaction_id
WHERE da.personnel_username = '$username'
AND t.transaction_id IN (
      SELECT transaction_id 
      FROM DeliveryDetails 
      WHERE delivery_status = 'To Ship'
  )
";

$result = $conn->query($sql);
$deliveries = [];

if ($result && $result->num_rows > 0) {
    $grouped = [];

    while ($row = $result->fetch_assoc()) {
        $tid = $row['transaction_id'];

        if (!isset($grouped[$tid])) {
            $grouped[$tid] = [
                'transactionNo' => $tid,
                'customerName' => $row['customer_name'],
                'address' => $row['customer_address'],
                'contact' => $row['customer_contact'],
                'paymentMode' => $row['mode_of_payment'],
                'items' => [],
                'totalCost' => 0
            ];
        }

        $itemTotal = (float)$row['item_total'];

        $grouped[$tid]['items'][] = [
            'name' => $row['description'],
            'qty' => (int)$row['quantity'],
            'price' => number_format($itemTotal, 2)
        ];

        $grouped[$tid]['totalCost'] += $itemTotal;
    }

    // Format final output
    foreach ($grouped as &$order) {
        $order['unitCost'] = count($order['items']) > 0 ? "₱" . $order['items'][0]['price'] : "₱0.00";
        $order['totalCost'] = "₱" . number_format($order['totalCost'], 2);
        $deliveries[] = $order;
    }
}

echo json_encode($deliveries);
$conn->close();

?>