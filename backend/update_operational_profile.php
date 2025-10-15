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

// Handle preflight (CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'database.php';

// Ensure logged in
if (!isset($_SESSION['manager_username'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

// Decode JSON input safely
$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid or missing JSON payload"]);
    exit;
}

// Extract fields
$old_username = $_SESSION['manager_username'];
$new_username = $data['manager_username'] ?? null;
$manager_fname = $data['manager_fname'] ?? null;
$manager_lname = $data['manager_lname'] ?? null;
$manager_email = $data['manager_email'] ?? null;
$manager_phone = $data['manager_phone'] ?? null;

// Validate required fields
if (!$new_username || !$manager_fname || !$manager_lname || !$manager_email || !$manager_phone) {
    http_response_code(400);
    echo json_encode(["error" => "Missing required fields"]);
    exit;
}

// Prepare update query
$stmt = $conn->prepare("
    UPDATE OperationalManager 
    SET manager_username = ?, manager_fname = ?, manager_lname = ?, manager_email = ?, manager_phone = ?
    WHERE manager_username = ?
");

if (!$stmt) {
    http_response_code(500);
    echo json_encode(["error" => "Failed to prepare SQL: " . $conn->error]);
    exit;
}

$stmt->bind_param("ssssss", $new_username, $manager_fname, $manager_lname, $manager_email, $manager_phone, $old_username);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        // Update session if username changed
        $_SESSION['manager_username'] = $new_username;
        session_write_close();

        echo json_encode([
            "success" => true,
            "message" => "Profile updated successfully",
            "new_username" => $new_username
        ]);
    } else {
        http_response_code(404);
        echo json_encode(["error" => "No changes detected or record not found"]);
    }
} else {
    http_response_code(500);
    echo json_encode(["error" => "SQL execution failed: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
