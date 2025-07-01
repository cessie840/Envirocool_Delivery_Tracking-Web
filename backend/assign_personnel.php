<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

include 'database.php';

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->transaction_id) || !isset($data->personnelUsername)) {
    echo json_encode(["success" => false, "message" => "Missing required fields."]);
    exit;
}

$transactionId = intval($data->transaction_id);
$personnelUsername = $conn->real_escape_string($data->personnelUsername);

// Check if transaction already assigned
$checkSql = "SELECT assignment_id FROM DeliveryAssignments WHERE transaction_id = ?";
$checkStmt = $conn->prepare($checkSql);
$checkStmt->bind_param("i", $transactionId);
$checkStmt->execute();
$checkStmt->store_result();

if ($checkStmt->num_rows > 0) {
    echo json_encode([
        "success" => false,
        "message" => "This transaction already has a delivery personnel assigned."
    ]);
    $checkStmt->close();
    $conn->close();
    exit;
}
$checkStmt->close();

// Assign personnel (no limit on delivery count)
$assignSql = "INSERT INTO DeliveryAssignments (transaction_id, personnel_username) VALUES (?, ?)";
$assignStmt = $conn->prepare($assignSql);
$assignStmt->bind_param("is", $transactionId, $personnelUsername);
$assignSuccess = $assignStmt->execute();
$assignStmt->close();

if (!$assignSuccess) {
    echo json_encode([
        "success" => false,
        "message" => "Failed to assign personnel."
    ]);
    $conn->close();
    exit;
}

// Fetch all po_ids from PurchaseOrder for this transaction
$poSql = "SELECT po_id FROM PurchaseOrder WHERE transaction_id = ?";
$poStmt = $conn->prepare($poSql);
$poStmt->bind_param("i", $transactionId);
$poStmt->execute();
$poResult = $poStmt->get_result();

$insertedAll = true;

while ($row = $poResult->fetch_assoc()) {
    $poId = $row['po_id'];

    // Insert into DeliveryDetails for each po_id
    $deliverySql = "INSERT INTO DeliveryDetails (transaction_id, po_id, delivery_status) VALUES (?, ?, 'To Ship')";
    $deliveryStmt = $conn->prepare($deliverySql);
    $deliveryStmt->bind_param("ii", $transactionId, $poId);

    if (!$deliveryStmt->execute()) {
        $insertedAll = false;
    }

    $deliveryStmt->close();
}

$poStmt->close();
$conn->close();

if ($insertedAll) {
    echo json_encode([
        "success" => true,
        "message" => "Personnel assigned and all delivery details created."
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Personnel assigned but some delivery details failed to insert."
    ]);
}
?>
