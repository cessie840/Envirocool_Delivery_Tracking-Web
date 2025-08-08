<?php
// List of allowed origins
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174'
];

// If the request's origin is allowed, send the CORS header
if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Max-Age: 86400"); // Cache preflight for 1 day
    http_response_code(200);
    exit();
}

include 'database.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->username) || empty($data->username)) {
        echo json_encode(["status" => "error", "message" => "Username is required."]);
        exit;
    }

    $username = $conn->real_escape_string($data->username);

    $updateSql = "UPDATE DeliveryPersonnel SET status = 'Inactive' WHERE pers_username = '$username'";
    if ($conn->query($updateSql) === TRUE) {
        echo json_encode(["status" => "success", "message" => "Personnel hidden (soft deleted)."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to hide personnel."]);
    }
    exit;
}
?>
