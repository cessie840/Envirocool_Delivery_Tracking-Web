<?php
if (isset($_SERVER['HTTP_ORIGIN'])) {
     $allowed_origins = ['http://localhost:5173', 'http://localhost:5174'];


    if (in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
        header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
        header("Access-Control-Allow-Credentials: true");
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();
include 'database.php';

header("Content-Type: application/json; charset=UTF-8");

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->username) || !isset($data->password)) {
    http_response_code(400);
    echo json_encode(["error" => "Missing username or password"]);
    exit();
}

$username = $data->username;
$password = $data->password;
$token = $data->token ?? null;

if (!$token) {
    http_response_code(400);
    echo json_encode(["error" => "captcha_missing"]);
    exit();
}

$secretKey = "6LcaEe0rAAAAAH_LDvgmTV0q1EHROYovEdRfkjW0"; // Your Secret Key
$verifyURL = "https://www.google.com/recaptcha/api/siteverify?secret=$secretKey&response=$token";

$response = file_get_contents($verifyURL);
$responseData = json_decode($response);

if (!$responseData->success) {
    http_response_code(400);
    echo json_encode(["error" => "captcha_failed"]);
    exit();
}

// ✅ Function to log successful logins
function logLogin($username, $role, $details = []) {
    $logFile = __DIR__ . '/login_logs.txt';
    $timestamp = date("Y-m-d H:i:s");

    $userDetails = isset($details['email']) ? $details['email'] : 'N/A';
    $fullname = trim(($details['fname'] ?? '') . ' ' . ($details['lname'] ?? ''));

    $logEntry = "[$timestamp] USER: $username | ROLE: $role | NAME: $fullname | EMAIL: $userDetails\n";
    file_put_contents($logFile, $logEntry, FILE_APPEND);
}

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

    // ✅ Log this login
    logLogin($username, 'Admin', [
        'fname' => $user['ad_fname'],
        'lname' => $user['ad_lname'],
        'email' => $user['ad_email']
    ]);

    echo json_encode(["status" => "success", "user" => $user]);
    exit();
}

// OPERATIONAL MANAGER 
$user = checkUser($conn, "OperationalManager", "manager_username", "manager_password", "manager_fname, manager_lname, manager_email, manager_phone");
if ($user) {
    unset($_SESSION['ad_username'], $_SESSION['pers_username']); 
    $_SESSION['manager_username'] = $username;

    // ✅ Log this login
    logLogin($username, 'OperationalManager', [
        'fname' => $user['manager_fname'],
        'lname' => $user['manager_lname'],
        'email' => $user['manager_email']
    ]);

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

    // ✅ Log this login
    logLogin($username, 'DeliveryPersonnel', [
        'fname' => $user['pers_fname'],
        'lname' => $user['pers_lname'],
        'email' => $user['pers_email']
    ]);

    echo json_encode(["status" => "success", "user" => $user]);
    exit();
}

http_response_code(404);
echo json_encode(["error" => "Invalid username"]);
$conn->close();
?>
