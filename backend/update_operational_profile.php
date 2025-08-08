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
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();
include 'database.php';

if (!isset($_SESSION['manager_username'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

// Get the old username from session
$old_username = $_SESSION['manager_username'];

$data = json_decode(file_get_contents("php://input"), true);

// Get new data (including possibly new username)
$new_username = $data['manager_username'];
$manager_fname = $data['manager_fname'];
$manager_lname = $data['manager_lname'];
$manager_email = $data['manager_email'];
$manager_phone = $data['manager_phone'];

// Update the record
$sql = "UPDATE OperationalManager 
        SET manager_username = ?, manager_fname = ?, manager_lname = ?, manager_email = ?, manager_phone = ?
        WHERE manager_username = ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param("ssssss", $new_username, $manager_fname, $manager_lname, $manager_email, $manager_phone, $old_username);

if ($stmt->execute() && $stmt->affected_rows > 0) {
    $_SESSION['manager_username'] = $new_username;
    session_write_close(); 

    echo json_encode([
        "success" => true,
        "new_username" => $new_username
    ]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Update failed"]);
}
