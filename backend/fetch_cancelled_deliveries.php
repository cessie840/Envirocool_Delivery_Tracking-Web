<?php
// Allowed origins
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

// Handle preflight (OPTIONS) request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Headers: Content-Type");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    http_response_code(200);
    exit();
}

header("Content-Type: application/json");

include 'database.php'; // assumes $conn is available

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->pers_username) || empty($data->pers_username)) {
    echo json_encode([
        "success" => false,
        "message" => "Missing or empty 'pers_username'."
    ]);
    exit;
}

$username = $data->pers_username;

$sql = "
SELECT 
    t.transaction_id AS transactionNo,
    t.customer_name AS customerName,
    t.customer_address AS address,
    t.customer_contact AS contact,
    t.mode_of_payment AS paymentMode,
    po.description AS name,
    po.quantity AS qty,
    po.unit_cost AS unitCost,
    (po.quantity * po.unit_cost) AS totalCost,
    cd.reason AS cancelledReason
FROM DeliveryAssignments da
JOIN Transactions t ON da.transaction_id = t.transaction_id
JOIN PurchaseOrder po ON po.transaction_id = t.transaction_id
JOIN DeliveryDetails dd ON dd.transaction_id = t.transaction_id AND dd.po_id = po.po_id
JOIN CancelledDeliveries cd ON cd.transaction_id = t.transaction_id
WHERE da.personnel_username = ?
  AND dd.delivery_status = 'Cancelled'
";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "Failed to prepare SQL: " . $conn->error
    ]);
    exit;
}

$stmt->bind_param("s", $username);

if (!$stmt->execute()) {
    echo json_encode([
        "success" => false,
        "message" => "Failed to execute SQL: " . $stmt->error
    ]);
    $stmt->close();
    exit;
}

$result = $stmt->get_result();

$deliveries = [];

while ($row = $result->fetch_assoc()) {
    $transactionNo = $row['transactionNo'];

    if (!isset($deliveries[$transactionNo])) {
        $deliveries[$transactionNo] = [
            "transactionNo" => $transactionNo,
            "customerName" => $row['customerName'],
            "address" => $row['address'],
            "contact" => $row['contact'],
            "paymentMode" => $row['paymentMode'],
            "unitCost" => $row['unitCost'],
            "totalCost" => $row['totalCost'],
            "cancelledReason" => $row['cancelledReason'],
            "items" => []
        ];
    }

    $deliveries[$transactionNo]['items'][] = [
        "name" => $row['name'],
        "qty" => $row['qty']
    ];
}

$stmt->close();
$conn->close();

echo json_encode(array_values($deliveries));
?>
