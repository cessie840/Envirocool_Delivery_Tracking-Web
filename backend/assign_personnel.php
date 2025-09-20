<?php
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'database.php';

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->transaction_id) || !isset($data->personnelUsername)) {
    echo json_encode(["success" => false, "message" => "Missing required fields."]);
    exit;
}

$transaction_id = intval($data->transaction_id);
$personnelUsername = $conn->real_escape_string($data->personnelUsername);

$checkSql = "SELECT assignment_id FROM DeliveryAssignments WHERE transaction_id = ?";
$checkStmt = $conn->prepare($checkSql);
$checkStmt->bind_param("i", $transaction_id);
$checkStmt->execute();
$checkStmt->store_result();

if ($checkStmt->num_rows > 0) {
    // Update existing assignment
    $updateAssignSql = "UPDATE DeliveryAssignments SET personnel_username = ? WHERE transaction_id = ?";
    $updateAssignStmt = $conn->prepare($updateAssignSql);
    $updateAssignStmt->bind_param("si", $personnelUsername, $transaction_id);
    $success = $updateAssignStmt->execute();
    $updateAssignStmt->close();
} else {
    // Insert new assignment
    $insertSql = "INSERT INTO DeliveryAssignments (transaction_id, personnel_username) VALUES (?, ?)";
    $insertStmt = $conn->prepare($insertSql);
    $insertStmt->bind_param("is", $transaction_id, $personnelUsername);
    $success = $insertStmt->execute();
    $insertStmt->close();
}
$checkStmt->close();

// 3. If success → update DeliveryPersonnel assignment_status
if ($success) {
    $updateSql = "UPDATE DeliveryPersonnel 
                  SET assignment_status = 'Out For Delivery', assigned_transaction_id = ? 
                  WHERE pers_username = ?";
    $updateStmt = $conn->prepare($updateSql);
    $updateStmt->bind_param("is", $transaction_id, $personnelUsername);
    $updateStmt->execute();
    $updateStmt->close();
}

$conn->close();

echo json_encode([
    "success" => $success,
    "message" => $success ? "Personnel assigned successfully." : "Failed to assign personnel."
]);
