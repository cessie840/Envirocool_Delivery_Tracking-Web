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
    $input = json_decode(file_get_contents("php://input"), true);

    if (!isset($input['transactionNo']) || !isset($input['reason'])) {
        respond(400, "Missing transaction number or reason.");
    }

    $transactionNo = intval($input['transactionNo']);
    $reason = trim($input['reason']);

    if ($transactionNo <= 0 || empty($reason)) {
        respond(400, "Invalid transaction number or reason.");
    }

    if (!$conn) {
        respond(500, "Database connection failed.");
    }

    // Step 1: Update the delivery status to "Cancelled"
    $updateStmt = $conn->prepare("UPDATE DeliveryDetails SET delivery_status = 'Cancelled' WHERE transaction_id = ?");
    if (!$updateStmt) {
        respond(500, "Failed to prepare update statement: " . $conn->error);
    }

    $updateStmt->bind_param("i", $transactionNo);
    if (!$updateStmt->execute()) {
        respond(500, "Execution failed: " . $updateStmt->error);
    }

    if ($updateStmt->affected_rows === 0) {
        respond(404, "No delivery found to update.");
    }

    // Step 2: Insert cancellation reason into CancelledDeliveries
    $insertStmt = $conn->prepare("INSERT INTO CancelledDeliveries (transaction_id, reason) VALUES (?, ?)");
    if (!$insertStmt) {
        respond(500, "Failed to prepare insert statement: " . $conn->error);
    }

    $insertStmt->bind_param("is", $transactionNo, $reason);
    if (!$insertStmt->execute()) {
        respond(500, "Failed to save cancellation reason: " . $insertStmt->error);
    }

    respond(200, "Delivery cancelled and reason saved.");

} catch (Exception $e) {
    respond(500, "Server error: " . $e->getMessage());
} finally {
    if (isset($updateStmt)) $updateStmt->close();
    if (isset($insertStmt)) $insertStmt->close();
    if (isset($conn)) $conn->close();
}
?>
