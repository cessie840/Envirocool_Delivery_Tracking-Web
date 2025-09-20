<?php
session_start(); 
include 'database.php';

$allowed_origins = ['http://localhost:5173'];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
} else {
    header("Access-Control-Allow-Origin: http://localhost:5173");
}

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->username) || !isset($data->password)) {
    http_response_code(400);
    echo json_encode(["error" => "Missing username or password"]);
    exit();
}

$username = $data->username;
$password = $data->password;

function checkUser($conn, $table, $user_col, $pass_col, $fields) {
    global $username, $password;

    $sql = "SELECT $user_col, $pass_col, $fields FROM $table WHERE BINARY $user_col = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        if (password_verify($password, $row[$pass_col])) {
            unset($row[$pass_col]);
            $row["role"] = strtolower($table);
            return $row;
        } else {
            http_response_code(401);
            echo json_encode(["error" => "Invalid password"]);
            exit();
        }
    }

    return null;
}

// ADMIN 
$user = checkUser($conn, "Admin", "ad_username", "ad_password", "ad_fname, ad_lname, ad_email, ad_phone");
if ($user) {
    unset($_SESSION['manager_username'], $_SESSION['pers_username']); 
    $_SESSION['ad_username'] = $username;
    echo json_encode(["status" => "success", "user" => $user]);
    exit();
}

// OPERATIONAL MANAGER 
$user = checkUser($conn, "OperationalManager", "manager_username", "manager_password", "manager_fname, manager_lname, manager_email, manager_phone");
if ($user) {
    unset($_SESSION['ad_username'], $_SESSION['pers_username']); 
    $_SESSION['manager_username'] = $username;
    echo json_encode(["status" => "success", "user" => $user]);
    exit();
}

// DELIVERY PERSONNEL 
$user = checkUser(
    $conn,
    "DeliveryPersonnel",
    "pers_username",
    "pers_password",
    "pers_fname, pers_lname, pers_email, pers_phone, status, assignment_status"
);
if ($user) {
    unset($_SESSION['ad_username'], $_SESSION['manager_username']); 
    $_SESSION['pers_username'] = $username;
    echo json_encode(["status" => "success", "user" => $user]);
    exit();
}

http_response_code(404);
echo json_encode(["error" => "Invalid username"]);
$conn->close();
