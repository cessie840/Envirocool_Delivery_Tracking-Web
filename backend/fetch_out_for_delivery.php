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

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->pers_username) || empty($data->pers_username)) {
    echo json_encode([
        "success" => false,
        "message" => "Missing or empty 'pers_username'."
    ]);
    exit;
}

$username = $data->pers_username;

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
    po.description AS name,
    po.quantity AS qty,
    po.unit_cost AS unitCost,
    (po.quantity * po.unit_cost) AS totalCost
FROM DeliveryAssignments da
JOIN Transactions t ON da.transaction_id = t.transaction_id
JOIN PurchaseOrder po ON po.transaction_id = t.transaction_id
WHERE da.personnel_username = ?
  AND t.status = 'Out for Delivery'
";


$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "Failed to prepare SQL statement: " . $conn->error
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
            "totalCost" => 0,
            "items" => []
        ];
    }

    $subtotal = $row['qty'] * $row['unitCost'];

    $deliveries[$transactionNo]['items'][] = [
        "name" => $row['name'],
        "qty" => (int)$row['qty'],
        "unitCost" => (float)$row['unitCost'],
        "subtotal" => (float)$subtotal
    ];

    $deliveries[$transactionNo]['totalCost'] += $subtotal;
}


$stmt->close();
$conn->close();

if (empty($deliveries)) {
    echo json_encode([
        "success" => true,
        "message" => "No 'Out for Delivery' transactions found.",
        "data" => []
    ]);
} else {
    echo json_encode(array_values($deliveries));
}
?>