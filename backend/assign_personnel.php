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

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'database.php';

$data = json_decode(file_get_contents("php://input"));

if (empty($data->transaction_id) || empty($data->personnelUsername)) {
    echo json_encode(["success" => false, "message" => "Missing required fields."]);
    exit;
}

$orderId = intval($data->transaction_id);
$personnelUsername = $conn->real_escape_string($data->personnelUsername);

// Check if order already has an assignment
$checkSql = "SELECT assignment_id FROM DeliveryAssignments WHERE transaction_id = ?";
$checkStmt = $conn->prepare($checkSql);
$checkStmt->bind_param("i", $orderId);
$checkStmt->execute();
$checkStmt->store_result();

if ($checkStmt->num_rows > 0) {
    echo json_encode([
        "success" => false,
        "message" => "This order already has a delivery personnel assigned."
    ]);
    $checkStmt->close();
    $conn->close();
    exit;
}

// Insert new assignment
$insertSql = "INSERT INTO DeliveryAssignments (transaction_id, personnel_username) VALUES (?, ?)";
$insertStmt = $conn->prepare($insertSql);
$insertStmt->bind_param("is", $orderId, $personnelUsername);
$success = $insertStmt->execute();

$insertStmt->close();
$checkStmt->close();
$conn->close();

echo json_encode([
    "success" => $success,
    "message" => $success ? "Personnel assigned successfully." : "Failed to assign personnel."
]);
