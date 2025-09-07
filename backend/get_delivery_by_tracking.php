<?php
require_once "database.php";

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle OPTIONS preflight
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit(0);
}

$data = json_decode(file_get_contents("php://input"), true);
$trackingNumber = isset($data["tracking_number"]) ? trim($data["tracking_number"]) : "";

if (empty($trackingNumber)) {
    echo json_encode(["success" => false, "message" => "Tracking number is required"]);
    exit;
}

// Prepare query
$sql = "
    SELECT 
        t.transaction_id,
        t.tracking_number,
        t.customer_name,
        t.customer_address,
        t.customer_contact,
        t.date_of_order,
        t.target_date_delivery,
        t.mode_of_payment,
        t.payment_option,
        t.total,
        t.status AS delivery_status
    FROM Transactions t
    WHERE t.tracking_number = ?
    LIMIT 1
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $trackingNumber);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    // Fetch purchase order items too
    $itemsSql = "SELECT description, quantity FROM PurchaseOrder WHERE transaction_id = ?";
    $itemsStmt = $conn->prepare($itemsSql);
    $itemsStmt->bind_param("i", $row["transaction_id"]);
    $itemsStmt->execute();
    $itemsResult = $itemsStmt->get_result();

    $items = [];
    while ($item = $itemsResult->fetch_assoc()) {
        $items[] = $item;
    }

    echo json_encode([
        "success" => true,
        "transaction" => $row,
        "items" => $items
    ]);

    $itemsStmt->close();
} else {
    echo json_encode(["success" => false, "message" => "Tracking number not found"]);
}

$stmt->close();
$conn->close();
