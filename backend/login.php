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
    echo json_encode([
        "errorName" => "MISSING_CREDENTIALS",
        "error" => "Missing username or password."
    ]);
    exit();
}

$username = trim($data->username);
$password = $data->password;

// ✅ Constants
$MAX_ATTEMPTS = 3;
$LOCK_TIME_MINUTES = 5;

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
    global $username, $password, $MAX_ATTEMPTS, $LOCK_TIME_MINUTES;

    $sql = "SELECT $user_col, $pass_col, $fields, login_attempts, last_attempt, is_locked 
            FROM $table WHERE BINARY $user_col = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if (!$row = $result->fetch_assoc()) {
        return null; // Username not found
    }

    // Check permanent lock
    if ($row['is_locked']) {
        http_response_code(403);
        echo json_encode([
            "errorName" => "ACCOUNT_LOCKED",
            "error" => "Your account is permanently locked. Please reset your password to unlock."
        ]);
        exit();
    }

    $attempts = $row['login_attempts'] ?? 0;
    $last_attempt = $row['last_attempt'] ?? null;
    $now = new DateTime();

    // Reset attempts if last attempt was long ago
    if ($last_attempt) {
        $last = new DateTime($last_attempt);
        $diff = $now->getTimestamp() - $last->getTimestamp();
        if ($diff > ($LOCK_TIME_MINUTES * 60)) {
            $attempts = 0;
            $stmt = $conn->prepare("UPDATE $table SET login_attempts = 0, last_attempt = NULL WHERE $user_col = ?");
            $stmt->bind_param("s", $username);
            $stmt->execute();
        }
    }

    // Password correct
    if (password_verify($password, $row[$pass_col])) {
        $stmt = $conn->prepare("UPDATE $table SET login_attempts = 0, last_attempt = NULL WHERE $user_col = ?");
        $stmt->bind_param("s", $username);
        $stmt->execute();

        unset($row[$pass_col]);
        $row["role"] = strtolower($table);
        return $row;
    }

    // Wrong password
    $attempts++;
    if ($attempts >= $MAX_ATTEMPTS) {
        // Lock account permanently
        $stmt = $conn->prepare("UPDATE $table SET login_attempts = ?, last_attempt = NOW(), is_locked = 1 WHERE $user_col = ?");
        $stmt->bind_param("is", $attempts, $username);
        $stmt->execute();

        http_response_code(403);
        echo json_encode([
            "errorName" => "MAX_ATTEMPTS_REACHED",
            "error" => "You have reached $MAX_ATTEMPTS invalid login attempts. Your account is now locked. Please reset your password to unlock."
        ]);
        exit();
    } else {
        // Just increment attempts
        $stmt = $conn->prepare("UPDATE $table SET login_attempts = ?, last_attempt = NOW() WHERE $user_col = ?");
        $stmt->bind_param("is", $attempts, $username);
        $stmt->execute();

        http_response_code(401);
        echo json_encode([
            "errorName" => "INVALID_PASSWORD",
            "error" => "Invalid password. Attempt $attempts of $MAX_ATTEMPTS."
        ]);
        exit();
    }
}


// ✅ ADMIN 
$user = checkUser($conn, "Admin", "ad_username", "ad_password", "ad_fname, ad_lname, ad_email, ad_phone");
if ($user) {
    unset($_SESSION['manager_username'], $_SESSION['pers_username']);
    $_SESSION['ad_username'] = $username;

    logLogin($username, 'Admin', [
        'fname' => $user['ad_fname'],
        'lname' => $user['ad_lname'],
        'email' => $user['ad_email']
    ]);

    echo json_encode(["status" => "success", "user" => $user]);
    exit();
}

// ✅ OPERATIONAL MANAGER 
$user = checkUser($conn, "OperationalManager", "manager_username", "manager_password", "manager_fname, manager_lname, manager_email, manager_phone");
if ($user) {
    unset($_SESSION['ad_username'], $_SESSION['pers_username']);
    $_SESSION['manager_username'] = $username;

    logLogin($username, 'OperationalManager', [
        'fname' => $user['manager_fname'],
        'lname' => $user['manager_lname'],
        'email' => $user['manager_email']
    ]);

    echo json_encode(["status" => "success", "user" => $user]);
    exit();
}

// ✅ DELIVERY PERSONNEL 
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

    logLogin($username, 'DeliveryPersonnel', [
        'fname' => $user['pers_fname'],
        'lname' => $user['pers_lname'],
        'email' => $user['pers_email']
    ]);

    echo json_encode(["status" => "success", "user" => $user]);
    exit();
}

// ❌ Username not found in any table
http_response_code(404);
echo json_encode([
    "errorName" => "INVALID_USERNAME",
    "error" => "Invalid username. Please check and try again."
]);

$conn->close();
?>
