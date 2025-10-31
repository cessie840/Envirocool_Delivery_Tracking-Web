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

if (empty($data['pers_username'])) {
    echo json_encode([
        "success" => false,
        "message" => "Missing or empty 'pers_username'."
    ]);
    exit;
}

$username = $data['pers_username'];

if (!$conn) {
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed."
    ]);
    exit;
}

$sql = "
SELECT 
    t.transaction_id AS transactionNo,
    t.customer_name AS customerName,
    t.customer_address AS address,
    t.customer_contact AS contact,
    t.mode_of_payment AS paymentMode,
    po.type_of_product AS product_name,
    po.description AS description,
    po.quantity AS qty,
    po.unit_cost AS unitCost,
    (po.quantity * po.unit_cost) AS subtotal
FROM DeliveryAssignments da
JOIN Transactions t ON da.transaction_id = t.transaction_id
JOIN PurchaseOrder po ON po.transaction_id = t.transaction_id
WHERE da.personnel_username = ?
  AND t.status = 'Delivered'
ORDER BY t.transaction_id DESC
";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "SQL preparation failed: " . $conn->error
    ]);
    exit;
}

$stmt->bind_param("s", $username);

if (!$stmt->execute()) {
    echo json_encode([
        "success" => false,
        "message" => "SQL execution failed: " . $stmt->error
    ]);
    $stmt->close();
    exit;
}

$result = $stmt->get_result();
$deliveries = [];

while ($row = $result->fetch_assoc()) {
    $tid = $row['transactionNo'];

    if (!isset($deliveries[$tid])) {
        $deliveries[$tid] = [
            "transactionNo" => $tid,
            "customerName" => $row['customerName'],
            "address" => $row['address'],
            "contact" => $row['contact'],
            "paymentMode" => $row['paymentMode'],
            "totalCost" => 0,
            "items" => []
        ];
    }

    $subtotal = (float) $row['subtotal'];

    $deliveries[$tid]['items'][] = [
        "name" => trim(($row['product_name'] ?? '') . ' ' . ($row['description'] ?? '')),
        "qty" => (int) $row['qty'],
        "unitCost" => (float) $row['unitCost'],
        "subtotal" => $subtotal
    ];

    $deliveries[$tid]['totalCost'] += $subtotal;
}

$stmt->close();
$conn->close();

if (empty($deliveries)) {
    echo json_encode([
        "success" => true,
        "message" => "No successful deliveries found.",
        "data" => []
    ]);
} else {
    echo json_encode([
        "success" => true,
        "data" => array_values($deliveries)
    ]);
}
?>
