<?php
// CORS headers
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

if (!$conn) {
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit;
}

// ✅ Fetch ALL out-for-delivery, including assigned driver
$sql = "

SELECT 
    t.transaction_id AS transactionNo,
    t.customer_name AS customerName,
    t.customer_address AS address,
    t.customer_contact AS contact,
    t.mode_of_payment AS paymentMode,
    da.personnel_username AS driverUsername,
    CONCAT(dp.pers_fname, ' ', dp.pers_lname) AS driverName,
    po.description AS itemName,
    po.quantity AS qty,
    po.unit_cost AS unitCost,
    (po.quantity * po.unit_cost) AS totalCost
FROM DeliveryAssignments da
JOIN Transactions t ON da.transaction_id = t.transaction_id
JOIN PurchaseOrder po ON po.transaction_id = t.transaction_id
JOIN DeliveryPersonnel dp ON da.personnel_username = dp.pers_username   -- ✅ FIX: join personnel table
WHERE t.status = 'Out for Delivery'
ORDER BY da.personnel_username, t.transaction_id
";


$result = $conn->query($sql);

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
            "driverUsername" => $row['driverUsername'],
            "driverName" => $row['driverName'],
            "items" => []
        ];
    }

    $deliveries[$transactionNo]['items'][] = [
        "name" => $row['itemName'],
        "qty" => $row['qty'],
        "price" => $row['qty'] * $row['unitCost']
    ];
}

$conn->close();

echo json_encode(array_values($deliveries));
?>
