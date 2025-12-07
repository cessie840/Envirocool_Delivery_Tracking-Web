<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
    header("Access-Control-Allow-Credentials: true");
}

header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(["success" => true, "message" => "Preflight OK"]);
    exit();
}

include 'database.php'; // Your DB connection

$response = [
    "success" => false,
    "message" => ""
];

$data = json_decode(file_get_contents("php://input"), true);
$username = trim($data['username'] ?? '');
$role = trim($data['role'] ?? '');
$permissions = $data['permissions'] ?? [];

if (!$username || !$role || !is_array($permissions)) {
    $response['message'] = "Invalid input";
    echo json_encode($response);
    exit();
}

// Convert permissions array to JSON
$perm_json = json_encode($permissions);
if ($perm_json === false) {
    $response['message'] = "Failed to encode permissions";
    echo json_encode($response);
    exit();
}

// Insert or Update in user_permissions table
$stmt = $conn->prepare("
    INSERT INTO user_permissions (username, role, permissions) 
    VALUES (?, ?, ?) 
    ON DUPLICATE KEY UPDATE permissions = VALUES(permissions)
");
$stmt->bind_param("sss", $username, $role, $perm_json);

if ($stmt->execute()) {
    $response['success'] = true;
    $response['message'] = "Permissions saved successfully";
} else {
    $response['message'] = "Failed to save permissions: " . $stmt->error;
}

$stmt->close();
$conn->close();

echo json_encode($response);
?>
