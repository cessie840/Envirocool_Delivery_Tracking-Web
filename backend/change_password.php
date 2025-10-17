<?php
include 'database.php';

// --- CORS setup ---
$allowed_origins = [
    'http://localhost:5173',
    'https://cessie840.github.io'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
} else {
    header("Access-Control-Allow-Origin: http://localhost:5173"); // fallback
}

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --- Input handling ---
$data = json_decode(file_get_contents("php://input"), true);
$email = trim($data['email']);
$newPassword = trim($data['newPassword']);

if (!$email || !$newPassword) {
    echo json_encode(["status" => "missing_fields", "message" => "Email and new password are required."]);
    exit;
}

$hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

// Include correct email and password column names per table
$tablesToCheck = [
    "Admin" => ["email" => "ad_email", "password" => "ad_password"],
    "OperationalManager" => ["email" => "manager_email", "password" => "manager_password"],
    "DeliveryPersonnel" => ["email" => "pers_email", "password" => "pers_password"]
];

$updated = false;

foreach ($tablesToCheck as $table => $columns) {
    $emailCol = $columns['email'];
    $passwordCol = $columns['password'];

    $stmt = $conn->prepare("SELECT * FROM $table WHERE $emailCol = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $stmt->close();

        $updateStmt = $conn->prepare("UPDATE $table SET $passwordCol = ? WHERE $emailCol = ?");
        $updateStmt->bind_param("ss", $hashedPassword, $email);
        $updateStmt->execute();
        $updateStmt->close();

        echo json_encode(["status" => "success", "message" => "Password has been updated."]);
        $updated = true;
        break;
    }

    $stmt->close();
}

if (!$updated) {
    echo json_encode(["status" => "not_found", "message" => "Email not found."]);
}

$conn->close();
?>
