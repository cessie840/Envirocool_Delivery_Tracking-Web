<?php
session_start();
include 'database.php';

if (!isset($_SESSION['ad_username'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$ad_fname = $data['ad_fname'];
$ad_lname = $data['ad_lname'];
$ad_email = $data['ad_email'];
$ad_phone = $data['ad_phone'];
$username = $_SESSION['ad_username'];

$sql = "UPDATE Admin SET ad_fname = ?, ad_lname = ?, ad_email = ?, ad_phone = ? WHERE ad_username = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("sssss", $ad_fname, $ad_lname, $ad_email, $ad_phone, $username);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Update failed"]);
}
?>
