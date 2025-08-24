<?php
session_start();

$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

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

   
    $stmt = $conn->prepare("
        UPDATE Transactions 
        SET status = 'Delivered', completed_at = NOW()
        WHERE transaction_id = ? AND status = 'Out for Delivery'
    ");

    if (!$stmt) {
        throw new Exception("Failed to prepare SQL statement: " . $conn->error);
    }

    $stmt->bind_param("s", $transactionId);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode([
                "success" => true,
                "message" => "Delivery marked as Delivered successfully",
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