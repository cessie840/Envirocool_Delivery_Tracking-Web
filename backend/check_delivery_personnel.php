<?php
$allowed_origins = [
    'http://localhost:5173',
    'https://cessie840.github.io'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
} else {
    header("Access-Control-Allow-Origin: http://localhost:5173"); 
}

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include 'database.php';

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->pers_username)) {
    echo json_encode(["success" => false, "message" => "Missing username"]);
    exit;
}

$username = $data->pers_username;

try {
    $stmt = $conn->prepare("
        SELECT 
            pers_username,
            pers_fname,
            pers_lname,
            pers_email,
            pers_phone,
            pers_age,
            pers_gender,
            pers_birth,
            pers_profile_pic
        FROM DeliveryPersonnel 
        WHERE pers_username = ?
    ");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result && $result->num_rows > 0) {
        $user = $result->fetch_assoc();
        echo json_encode([
            "success" => true,
            "user" => $user
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "User not found"]);
    }

    $stmt->close();
    $conn->close();
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
