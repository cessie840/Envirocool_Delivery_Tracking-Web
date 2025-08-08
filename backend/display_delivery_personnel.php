<?php

$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Max-Age: 86400"); 
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

    // Soft delete by updating the status
    $updateSql = "UPDATE DeliveryPersonnel SET status = 'Inactive' WHERE pers_username = '$username'";
    if ($conn->query($updateSql) === TRUE) {
        echo json_encode(["status" => "success", "message" => "Personnel hidden (soft deleted)."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to hide personnel."]);
    }
    exit; 
}

// DISPLAY ACCOUNTS
$sql = "SELECT 
            pers_fname,
            pers_lname,
            pers_username,
            pers_email,
            pers_birth AS pers_password
        FROM DeliveryPersonnel
        WHERE status = 'Active'";

$result = $conn->query($sql);

$personnel = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $personnel[] = $row;
    }
}

echo json_encode($personnel);
