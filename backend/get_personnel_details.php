<?php
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

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->pers_username)) {
    echo json_encode(["success" => false, "message" => "Missing required field: pers_username"]);
    exit;
}

$pers_username = $data->pers_username;

// Fetch personnel details
$sql = "SELECT pers_username, pers_fname, pers_lname, pers_email, pers_phone, pers_profile_pic, 
               pers_age, pers_gender, pers_birth, status
        FROM DeliveryPersonnel 
        WHERE pers_username = ? LIMIT 1";

$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $pers_username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Personnel not found."]);
    $stmt->close();
    $conn->close();
    exit;
}

$user = $result->fetch_assoc();

$baseURL = "http://localhost/DeliveryTrackingSystem/uploads/";
if (empty($user['pers_profile_pic'])) {
    $user['pers_profile_pic'] = $baseURL . "default-profile-pic.png";
} else {
    $user['pers_profile_pic'] = $baseURL . $user['pers_profile_pic'];
}

$stmt->close();
$conn->close();

echo json_encode([
    "success" => true,
    "user" => $user
]);
