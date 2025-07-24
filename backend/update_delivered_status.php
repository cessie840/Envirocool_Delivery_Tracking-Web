<?php
// CORS headers
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: http://localhost:5173");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    http_response_code(200);
    exit();
}

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

// Database connection
include 'database.php';

try {
    // Decode JSON input
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['transaction_id']) || empty($data['transaction_id'])) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Transaction ID is required",
            "error_code" => "ERR_MISSING_ID"
        ]);
        exit;
    }

    $transactionId = $conn->real_escape_string($data['transaction_id']);

    $stmt = $conn->prepare("UPDATE DeliveryDetails SET delivery_status = 'Delivered' WHERE transaction_id = ? AND delivery_status = 'Out for Delivery'");

    if (!$stmt) {
        throw new Exception("Failed to prepare SQL statement: " . $conn->error);
    }

    $stmt->bind_param("s", $transactionId);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode([
                "success" => true,
                "message" => "Delivery Successfully",
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