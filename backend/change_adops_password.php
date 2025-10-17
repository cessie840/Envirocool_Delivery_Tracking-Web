<?php
$allowed_origins = [
    'http://localhost:5173',
    'https://cessie840.github.io',
    'http://localhost:5173/Envirocool-Tracking-Page'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
} else {
    header("Access-Control-Allow-Origin: http://localhost:5173");
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();
include 'database.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['currentPassword']) || !isset($data['newPassword'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Missing required fields."]);
    exit();
}

$currentPassword = trim($data['currentPassword']);
$newPassword = trim($data['newPassword']);

if (isset($_SESSION['ad_username'])) {
    $table = "Admin";
    $userCol = "ad_username";
    $passCol = "ad_password";
    $username = $_SESSION['ad_username'];
} elseif (isset($_SESSION['manager_username'])) {
    $table = "OperationalManager";
    $userCol = "manager_username";
    $passCol = "manager_password";
    $username = $_SESSION['manager_username'];
} else {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Unauthorized. No session."]);
    exit();
}

// ✅ Verify old password
$sql = "SELECT $passCol FROM $table WHERE $userCol = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    if (!password_verify($currentPassword, $row[$passCol])) {
        http_response_code(401);
        echo json_encode(["success" => false, "error" => "Current password is incorrect."]);
        exit();
    }
} else {
    http_response_code(404);
    echo json_encode(["success" => false, "error" => "User not found."]);
    exit();
}

// ✅ Validate new password
$pattern = '/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/';
if (!preg_match($pattern, $newPassword)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Weak password format."]);
    exit();
}

// ✅ Update password
$newHash = password_hash($newPassword, PASSWORD_DEFAULT);
$updateSql = "UPDATE $table SET $passCol = ? WHERE $userCol = ?";
$updateStmt = $conn->prepare($updateSql);
$updateStmt->bind_param("ss", $newHash, $username);

if ($updateStmt->execute()) {
    echo json_encode(["success" => true, "message" => "Password updated successfully."]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Failed to update password."]);
}

$conn->close();
?>
