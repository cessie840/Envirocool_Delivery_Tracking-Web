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

    // Prepare SQL statement
    $stmt = $conn->prepare("UPDATE DeliveryDetails 
                            SET delivery_status = 'Out for Delivery' 
                               WHERE transaction_id = '$transactionNo' AND delivery_status = 'To Ship'
                            ");
    if (!$stmt) {
        respond(500, "Failed to prepare SQL statement: " . $conn->error);
    }

    // Bind and execute
    $stmt->bind_param("i", $transactionNo);
    if (!$stmt->execute()) {
        respond(500, "Execution failed: " . $stmt->error);
    }

    // Check if any rows were updated
    if ($stmt->affected_rows === 0) {
        respond(404, "No matching delivery found or already updated.");
    }

    respond(200, "Delivery marked as 'Out for Delivery'.");

} catch (Exception $e) {
    respond(500, "Unexpected server error.", $e->getMessage());
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($conn)) $conn->close();
}

?>
