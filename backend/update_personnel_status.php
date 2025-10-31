<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include "database.php";

$data = json_decode(file_get_contents("php://input"), true);

$username = isset($data['username']) ? trim($data['username']) : '';
$status   = isset($data['status']) ? trim($data['status']) : '';

if (!$username || !$status) {
    echo json_encode(["success" => false, "message" => "Invalid input: username and status are required."]);
    $conn->close();
    exit;
}

$status = (strtolower($status) === 'active') ? 'Active' : 'Inactive';

$stmt = $conn->prepare("SELECT pers_username, status, assignment_status 
                        FROM DeliveryPersonnel 
                        WHERE pers_username = ? LIMIT 1");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();
if (!$result || $result->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Personnel not found."]);
    $stmt->close();
    $conn->close();
    exit;
}
$personRow = $result->fetch_assoc();
$stmt->close();

$checkSql = "
    SELECT 1
    FROM DeliveryAssignments da
    INNER JOIN Transactions t ON da.transaction_id = t.transaction_id
    WHERE da.personnel_username = ?
      AND LOWER(t.status) = 'out for delivery'
    LIMIT 1
";
$stmt = $conn->prepare($checkSql);
$stmt->bind_param("s", $username);
$stmt->execute();
$checkResult = $stmt->get_result();
$isOutForDelivery = ($checkResult && $checkResult->num_rows > 0);
$stmt->close();

if ($status === "Inactive") {
    $assignment_status = null;
} else {
    // Active
    $assignment_status = $isOutForDelivery ? "Out for Delivery" : "Available";
}

if ($assignment_status === null) {
    $updateSql = "UPDATE DeliveryPersonnel SET status = ?, assignment_status = NULL WHERE pers_username = ?";
    $stmt = $conn->prepare($updateSql);
    $stmt->bind_param("ss", $status, $username);
} else {
    $updateSql = "UPDATE DeliveryPersonnel SET status = ?, assignment_status = ? WHERE pers_username = ?";
    $stmt = $conn->prepare($updateSql);
    $stmt->bind_param("sss", $status, $assignment_status, $username);
}

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Status updated successfully.",
        "assignment_status" => $assignment_status
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Database update failed: " . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
