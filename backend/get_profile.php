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
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'database.php';

if (isset($_SESSION['ad_username'])) {
    $username = $_SESSION['ad_username'];
    $sql = "SELECT ad_username, ad_fname, ad_lname, ad_email, ad_phone FROM Admin WHERE ad_username = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    echo json_encode($result->fetch_assoc());
    exit;
}

if (isset($_SESSION['manager_username'])) {
    $username = $_SESSION['manager_username'];
    $sql = "SELECT manager_username, manager_fname, manager_lname, manager_email, manager_phone FROM OperationalManager WHERE manager_username = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    echo json_encode($result->fetch_assoc());
    exit;
}

http_response_code(401);
echo json_encode(["error" => "Unauthorized"]);
exit;
