<?php
include 'database.php';

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: http://localhost:5173");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    http_response_code(200);
    exit();
}

// Helper function to return JSON response
function respond($statusCode, $message, $data = null) {
    http_response_code($statusCode);
    echo json_encode([
        'success' => $statusCode >= 200 && $statusCode < 300,
        'message' => $message,
        'data' => $data
    ]);
    exit();
}

try {
    // Get raw input and decode
    $input = json_decode(file_get_contents("php://input"), true);

    if (!isset($input['transactionNo'])) {
        respond(400, "Missing transaction number.");
    }

    if (!is_numeric($input['transactionNo'])) {
        respond(400, "Transaction number must be numeric.");
    }

    $transactionNo = intval($input['transactionNo']);

    if ($transactionNo <= 0) {
        respond(400, "Invalid transaction number.");
    }

    // Check DB connection
    if (!$conn) {
        respond(500, "Database connection failed.");
    }

    // Check if already "Out for Delivery"
    $checkStmt = $conn->prepare("SELECT delivery_status FROM DeliveryDetails WHERE transaction_id = ?");
    if (!$checkStmt) {
        respond(500, "Failed to prepare status check query: " . $conn->error);
    }

    $checkStmt->bind_param("i", $transactionNo);
    $checkStmt->execute();
    $result = $checkStmt->get_result();

    if ($result->num_rows === 0) {
        respond(404, "Transaction not found.");
    }

    $row = $result->fetch_assoc();
    if ($row['delivery_status'] === 'Out for Delivery') {
        respond(409, "Delivery is already marked as 'Out for Delivery'.");
    }

    // Now attempt update
    $stmt = $conn->prepare("UPDATE DeliveryDetails 
                            SET delivery_status = 'Out for Delivery' 
                            WHERE transaction_id = ? AND delivery_status = 'To Ship'");
    if (!$stmt) {
        respond(500, "Failed to prepare update statement: " . $conn->error);
    }

    $stmt->bind_param("i", $transactionNo);
    if (!$stmt->execute()) {
        respond(500, "Execution failed: " . $stmt->error);
    }

    if ($stmt->affected_rows === 0) {
        respond(404, "No matching delivery found or it has already been updated.");
    }

    respond(200, "Delivery marked as 'Out for Delivery'.");

} catch (Exception $e) {
    respond(500, "Unexpected server error.", $e->getMessage());
} finally {
    if (isset($checkStmt)) $checkStmt->close();
    if (isset($stmt)) $stmt->close();
    if (isset($conn)) $conn->close();
}
?>
