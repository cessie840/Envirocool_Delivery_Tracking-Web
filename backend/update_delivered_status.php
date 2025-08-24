<?php
// CORS headers
// Enable CORS
header("Access-Control-Allow-Origin: http://localhost:5173"); // allow your React app
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include 'database.php';

try {
    $data = json_decode(file_get_contents("php://input"), true);

    // Debug request payload
    file_put_contents("debug_update.log", print_r($data, true), FILE_APPEND);

    if (!isset($data['transaction_id']) || empty($data['transaction_id'])) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Transaction ID is required",
            "error_code" => "ERR_MISSING_ID"
        ]);
        exit;
    }

    if (!isset($data['status']) || empty($data['status'])) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Status is required",
            "error_code" => "ERR_MISSING_STATUS"
        ]);
        exit;
    }

    $transactionId = intval($data['transaction_id']); // force integer
    $status = trim($data['status']);

    // Decide which timestamp field to update
    $timestampField = null;
    if ($status === "Delivered") {
        $timestampField = "completed_at";
    } elseif ($status === "Cancelled") {
        $timestampField = "cancelled_at";
    } elseif ($status === "Out for Delivery") {
        $timestampField = "shipout_at";
    }

    if ($timestampField === null) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Invalid status value",
            "error_code" => "ERR_INVALID_STATUS"
        ]);
        exit;
    }

    // Update query
    $sql = "
        UPDATE Transactions 
        SET status = ?, $timestampField = NOW() 
        WHERE transaction_id = ?
    ";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Failed to prepare SQL: " . $conn->error);
    }

    // Bind params: status (string), transaction_id (int)
    $stmt->bind_param("si", $status, $transactionId);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode([
                "success" => true,
                "message" => "Transaction updated to $status successfully"
            ]);
        } else {
            http_response_code(404);
            echo json_encode([
                "success" => false,
                "message" => "No matching record found or already updated",
                "error_code" => "ERR_NOT_FOUND"
            ]);
        }
    } else {
        throw new Exception("SQL execution failed: " . $stmt->error);
    }

    $stmt->close();
    $conn->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Internal server error",
        "error_detail" => $e->getMessage(),
        "error_code" => "ERR_EXCEPTION"
    ]);
}
?>
