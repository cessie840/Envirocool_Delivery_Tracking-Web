<?php
session_start();
$allowed_origins = ['http://localhost:5173', 'http://localhost:5174'];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'database.php';

try {
    if (!isset($_SESSION['ad_username'])) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Unauthorized - please log in again"]);
        exit;
    }

    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid or missing JSON data"]);
        exit;
    }

    $required = ['ad_fname', 'ad_lname', 'ad_email', 'ad_phone'];
    foreach ($required as $field) {
        if (empty(trim($data[$field] ?? ''))) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Missing field: $field"]);
            exit;
        }
    }

    $stmt = $conn->prepare("
        UPDATE Admin 
        SET ad_fname = ?, ad_lname = ?, ad_email = ?, ad_phone = ?
        WHERE ad_username = ?
    ");
    $stmt->bind_param("sssss",
        $data['ad_fname'],
        $data['ad_lname'],
        $data['ad_email'],
        $data['ad_phone'],
        $_SESSION['ad_username']
    );

    $stmt->execute();

    echo json_encode([
        "success" => true,
        "message" => "Profile updated successfully"
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Internal server error", "detail" => $e->getMessage()]);
}
?>