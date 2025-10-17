<?php
include 'database.php';

// --- CORS ---
$allowed_origins = [
    "https://cessie840.github.io",
    "http://localhost:5173",
    "http://localhost:5173/Envirocool-Tracking-Page"
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
    header("Access-Control-Allow-Credentials: true");
}

header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

// --- SESSION ---
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '13.239.143.31', // must match your server IP or domain
    'secure' => true,             // HTTPS required
    'httponly' => true,
    'samesite' => 'None'
]);
session_start();

// Check sessions
if (isset($_SESSION['ad_username'])) { /* fetch admin */ }
elseif (isset($_SESSION['manager_username'])) { /* fetch manager */ }
elseif (isset($_SESSION['pers_username'])) { /* fetch personnel */ }
else {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit();
}


// ----------------------------
// Fetch profile
// ----------------------------
if (isset($_SESSION['ad_username'])) {
    $username = $_SESSION['ad_username'];
    $stmt = $conn->prepare("SELECT ad_username, ad_fname, ad_lname, ad_email, ad_phone FROM Admin WHERE ad_username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    echo json_encode($result->fetch_assoc());
    exit();
}

if (isset($_SESSION['manager_username'])) {
    $username = $_SESSION['manager_username'];
    $stmt = $conn->prepare("SELECT manager_username, manager_fname, manager_lname, manager_email, manager_phone FROM OperationalManager WHERE manager_username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    echo json_encode($result->fetch_assoc());
    exit();
}

if (isset($_SESSION['pers_username'])) {
    $username = $_SESSION['pers_username'];
    $stmt = $conn->prepare("SELECT pers_username, pers_fname, pers_lname, pers_email, pers_phone, status, assignment_status FROM DeliveryPersonnel WHERE pers_username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    echo json_encode($result->fetch_assoc());
    exit();
}

// If no session exists
http_response_code(401);
echo json_encode(["error" => "Unauthorized"]);
exit();
?>
