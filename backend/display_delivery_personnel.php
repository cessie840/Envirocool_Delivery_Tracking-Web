<?php
// Handle CORS preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: http://localhost:5173");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Max-Age: 86400");
    http_response_code(200);
    exit();
}

// Main POST headers
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");


include 'database.php';

// DELETE mode if POST request is received
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->username) || empty($data->username)) {
        echo json_encode(["status" => "error", "message" => "Username is required."]);
        exit;
    }

    $username = $conn->real_escape_string($data->username);

    // Soft delete by updating the status
    $updateSql = "UPDATE DeliveryPersonnel SET status = 'inactive' WHERE pers_username = '$username'";
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
        WHERE status = 'active'";

$result = $conn->query($sql);

$personnel = [];

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $personnel[] = $row;
    }
}

echo json_encode($personnel);
?>
