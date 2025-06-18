<?php
session_start();
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

include 'database.php';

if (!isset($_SESSION['ad_username'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
$currentPassword = $data['currentPassword'];
$newPassword = $data['newPassword'];

$username = $_SESSION['ad_username'];

// Get the current password from the DB
$sql = "SELECT ad_password FROM Admin WHERE ad_username = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();

if (!$row || $row['ad_password'] !== $currentPassword) {
    http_response_code(403);
    echo json_encode(["error" => "Current password is incorrect"]);
    exit();
}

// Update with new password
$update = "UPDATE Admin SET ad_password = ? WHERE ad_username = ?";
$updateStmt = $conn->prepare($update);
$updateStmt->bind_param("ss", $newPassword, $username);

if ($updateStmt->execute()) {
    echo json_encode(["message" => "Password updated successfully"]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Failed to update password"]);
}

$conn->close();
?>
