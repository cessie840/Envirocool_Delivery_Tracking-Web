<?php
session_start();

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'database.php';

if (!isset($_SESSION['ad_username'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$currentUsername = $_SESSION['ad_username'];
$newUsername = $data['ad_username'];

$sql = "UPDATE Admin SET 
            ad_username = ?, 
            ad_fname = ?, 
            ad_lname = ?, 
            ad_email = ?, 
            ad_phone = ? 
        WHERE ad_username = ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param("ssssss", 
    $newUsername, 
    $data['ad_fname'], 
    $data['ad_lname'], 
    $data['ad_email'], 
    $data['ad_phone'], 
    $currentUsername
);

if ($stmt->execute()) {
    $_SESSION['ad_username'] = $newUsername; 
    echo json_encode(["status" => "success"]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Update failed"]);
}

$conn->close();
?>