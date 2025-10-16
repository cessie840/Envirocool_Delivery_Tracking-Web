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
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'database.php';

try {
    // Check session
    if (!isset($_SESSION['ad_username'])) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Unauthorized - please log in again",
            "error_code" => "ERR_UNAUTHORIZED"
        ]);
        exit;
    }

    // Decode JSON
    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Invalid or missing JSON data",
            "error_code" => "ERR_INVALID_JSON"
        ]);
        exit;
    }

    // Validate fields
    $required = ['ad_username', 'ad_fname', 'ad_lname', 'ad_email', 'ad_phone'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty(trim($data[$field]))) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Missing required field: $field",
                "error_code" => "ERR_MISSING_FIELD"
            ]);
            exit;
        }
    }

    // Prepare SQL
    $stmt = $conn->prepare("
        UPDATE Admin 
        SET ad_fname = ?, ad_lname = ?, ad_email = ?, ad_phone = ?
        WHERE ad_username = ?
    ");

    if (!$stmt) {
        throw new Exception("Failed to prepare SQL: " . $conn->error);
    }

    $stmt->bind_param(
        "sssss",
        $data['ad_fname'],
        $data['ad_lname'],
        $data['ad_email'],
        $data['ad_phone'],
        $data['ad_username']
    );

    // Execute update
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode([
                "success" => true,
                "message" => "Profile updated successfully"
            ]);
        } else {
            http_response_code(404);
            echo json_encode([
                "success" => false,
                "message" => "No changes detected or record not found",
                "error_code" => "ERR_NO_CHANGE"
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
