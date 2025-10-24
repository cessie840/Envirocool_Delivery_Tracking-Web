<?php
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: http://localhost:5173");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    http_response_code(200);
    exit();
}

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
    t.transaction_id, 
    t.customer_name, 
    t.customer_address, 
    t.customer_contact, 
    t.mode_of_payment,
    t.status AS delivery_status,
    da.device_id,  -- ✅ include device ID here

    po.quantity, 
    po.type_of_product AS product_name,
    po.description, 
    po.unit_cost,
    (po.quantity * po.unit_cost) AS item_total
FROM DeliveryAssignments da
JOIN Transactions t ON da.transaction_id = t.transaction_id
JOIN PurchaseOrder po ON po.transaction_id = t.transaction_id
WHERE da.personnel_username = '$username'
ORDER BY t.created_at ASC
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
                'device_id' => $row['device_id'],
                'items' => [],
                'totalCost' => 0,
                'delivery_status' => $row['delivery_status']
            ];
        }

        $itemTotal = (float) $row['item_total'];

        // ✅ Use $row here, not $item
        $grouped[$tid]['items'][] = [
            'name' => trim(($row['product_name'] ?? '') . ' ' . ($row['description'] ?? '')),
            'qty' => (int) $row['quantity'],
            'unitCost' => (float) $row['unit_cost'],
            'price' => number_format($itemTotal, 2)
        ];

        $grouped[$tid]['totalCost'] += $itemTotal;
    }

    foreach ($grouped as &$order) {
        $order['unitCost'] = count($order['items']) > 0
            ? (float) $order['items'][0]['unitCost']
            : 0;

        $order['totalCost'] = round($order['totalCost'], 2);
        $deliveries[] = $order;
    }
}

echo json_encode($deliveries);
$conn->close();
?>
