<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// CORS handling
$allowed_origins = [
    "https://cessie840.github.io",
    "http://localhost:5173",
    "http://localhost:5173/Envirocool-Tracking-Page"
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
} else {
    header("Access-Control-Allow-Origin: http://localhost:5173"); // fallback
}

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}


include 'database.php';

// ✅ Parse JSON input
$data = json_decode(file_get_contents("php://input"));

if (
    empty($data->transaction_id) ||
    empty($data->personnelUsername) ||
    empty($data->device_id)
) {
    echo json_encode(["success" => false, "message" => "Missing required fields."]);
    exit;
}

$transaction_id = intval($data->transaction_id);
$personnelUsername = $conn->real_escape_string($data->personnelUsername);
$device_id = $conn->real_escape_string($data->device_id);

try {
    // ✅ Step 1: Check if this transaction already has an assignment
    $checkSql = "SELECT assignment_id FROM DeliveryAssignments WHERE transaction_id = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("i", $transaction_id);
    $checkStmt->execute();
    $checkStmt->store_result();

    if ($checkStmt->num_rows > 0) {
        // update existing
        $updateAssignSql = "UPDATE DeliveryAssignments 
                            SET personnel_username = ?, device_id = ? 
                            WHERE transaction_id = ?";
        $updateAssignStmt = $conn->prepare($updateAssignSql);
        $updateAssignStmt->bind_param("ssi", $personnelUsername, $device_id, $transaction_id);
        $success = $updateAssignStmt->execute();
        $updateAssignStmt->close();
    } else {
        // insert new
        $insertSql = "INSERT INTO DeliveryAssignments (transaction_id, personnel_username, device_id)
                      VALUES (?, ?, ?)";
        $insertStmt = $conn->prepare($insertSql);
        $insertStmt->bind_param("iss", $transaction_id, $personnelUsername, $device_id);
        $success = $insertStmt->execute();
        $insertStmt->close();
    }
    $checkStmt->close();

    // ✅ Step 2: Update DeliveryPersonnel
    if ($success) {
        $updateSql = "UPDATE DeliveryPersonnel 
                      SET assignment_status = 'Out for Delivery', assigned_transaction_id = ? 
                      WHERE pers_username = ?";
        $updateStmt = $conn->prepare($updateSql);
        $updateStmt->bind_param("is", $transaction_id, $personnelUsername);
        $updateStmt->execute();
        $updateStmt->close();
    }

    // ✅ Step 3: Update Transactions
    if ($success) {
        $updateTrans = "UPDATE Transactions 
                        SET assigned_device_id = ?, status = 'Pending'
                        WHERE transaction_id = ?";
        $updateTransStmt = $conn->prepare($updateTrans);
        $updateTransStmt->bind_param("si", $device_id, $transaction_id);
        $updateTransStmt->execute();
        $updateTransStmt->close();
    }

    echo json_encode([
        "success" => $success,
        "message" => $success
            ? "Personnel and truck assigned successfully."
            : "Failed to assign delivery. Database operation failed."
    ]);
} catch (Throwable $e) {
    echo json_encode([
        "success" => false,
        "message" => "Server error: " . $e->getMessage()
    ]);
}
$conn->close();
?>
