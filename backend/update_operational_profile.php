<?php
session_start();

$allowed_origins = ['http://localhost:5173', 'http://localhost:5174'];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'database.php';

try {
    // ✅ Ensure logged in
    if (!isset($_SESSION['manager_username'])) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Unauthorized - please log in again"
        ]);
        exit;
    }

    // ✅ Decode JSON input
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Invalid or missing JSON data"
        ]);
        exit;
    }

    // ✅ Required fields
    $required = ['manager_username', 'manager_fname', 'manager_lname', 'manager_email', 'manager_phone'];
    foreach ($required as $field) {
        if (empty(trim($data[$field] ?? ''))) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Missing field: $field"
            ]);
            exit;
        }
    }

    // ✅ Prepare and execute update
    $stmt = $conn->prepare("
        UPDATE OperationalManager
        SET manager_username = ?, manager_fname = ?, manager_lname = ?, manager_email = ?, manager_phone = ?
        WHERE manager_username = ?
    ");

    if (!$stmt) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Failed to prepare SQL statement"
        ]);
        exit;
    }

    $stmt->bind_param(
        "ssssss",
        $data['manager_username'],
        $data['manager_fname'],
        $data['manager_lname'],
        $data['manager_email'],
        $data['manager_phone'],
        $_SESSION['manager_username']
    );

    $stmt->execute();

    // ✅ Success response
    echo json_encode([
        "success" => true,
        "message" => "Profile updated successfully"
    ]);

    // ✅ Update session username if changed
    $_SESSION['manager_username'] = $data['manager_username'];

    $stmt->close();
    $conn->close();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Internal server error",
        "detail" => $e->getMessage()
    ]);
}
?>
