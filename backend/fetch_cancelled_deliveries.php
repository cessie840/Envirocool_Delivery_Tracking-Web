<?php
header("Content-Type: application/json");

$allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
} else {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Forbidden origin"]);
    exit;
}

require_once "database.php";

$data = json_decode(file_get_contents("php://input"), true);
$pers_username = $data['pers_username'] ?? '';

if (empty($pers_username)) {
    echo json_encode(["success" => false, "message" => "Missing delivery personnel username."]);
    exit;
}

$query = "
    SELECT 
        t.transaction_id,
        t.customer_name,
        t.customer_address,
        t.customer_contact,
        t.mode_of_payment,
        t.total AS totalCost,
        t.cancelled_reason,
        t.cancelled_at
    FROM Transactions t
    JOIN DeliveryAssignments da ON da.transaction_id = t.transaction_id
    JOIN DeliveryPersonnel dp ON da.personnel_username = dp.pers_username
    WHERE da.personnel_username = ? 
      AND t.status = 'Cancelled'
    ORDER BY t.cancelled_at DESC
";

$stmt = $conn->prepare($query);
$stmt->bind_param("s", $pers_username);
$stmt->execute();
$result = $stmt->get_result();

$deliveries = [];
while ($row = $result->fetch_assoc()) {

    $itemsQuery = "SELECT description, quantity, unit_cost FROM PurchaseOrder WHERE transaction_id = ?";
    $stmtItems = $conn->prepare($itemsQuery);
    $stmtItems->bind_param("i", $row['transaction_id']);
    $stmtItems->execute();
    $itemsResult = $stmtItems->get_result();

    $items = [];
    while ($itemRow = $itemsResult->fetch_assoc()) {
        $items[] = [
            "name"      => $itemRow['description'],
            "qty"       => $itemRow['quantity'],
            "unitCost"  => $itemRow['unit_cost']
        ];
    }

    $deliveries[] = [
        "transactionNo"   => $row['transaction_id'],
        "customerName"    => $row['customer_name'],
        "address"         => $row['customer_address'],
        "contact"         => $row['customer_contact'],
        "paymentMode"     => $row['mode_of_payment'],
        "items"           => $items,
        "totalCost"       => $row['totalCost'],
        "cancelledReason" => $row['cancelled_reason'],
        "cancelledAt"     => $row['cancelled_at']
    ];
}

echo json_encode([
    "success" => true,
    "data" => $deliveries
]);
