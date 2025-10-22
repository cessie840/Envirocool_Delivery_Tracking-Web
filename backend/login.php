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
    echo json_encode(["error" => "Missing username or password"]);
    exit();
}

$username = trim(htmlspecialchars($data->username));
$password = $data->password;
$MAX_ATTEMPTS = 3;
$LOCK_TIME_MINUTES = 5;

function logLogin($username, $role, $details = []) {
    $logFile = __DIR__ . '/login_logs.txt';
    $timestamp = date("Y-m-d H:i:s");
    $fullname = trim(($details['fname'] ?? '') . ' ' . ($details['lname'] ?? ''));
    $email = $details['email'] ?? 'N/A';
    file_put_contents($logFile, "[$timestamp] USER: $username | ROLE: $role | NAME: $fullname | EMAIL: $email\n", FILE_APPEND);
}

function checkUser($conn, $table, $user_col, $pass_col, $fields) {
    global $username, $password, $MAX_ATTEMPTS, $LOCK_TIME_MINUTES;

    $sql = "SELECT $user_col, $pass_col, $fields, login_attempts, last_attempt 
            FROM $table WHERE BINARY $user_col = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if (!$row = $result->fetch_assoc()) return null;

    $attempts = $row['login_attempts'] ?? 0;
    $last_attempt = $row['last_attempt'] ?? null;
    $now = new DateTime();
    $resetTime = $now;

    // Reset after 15 minutes
    if ($last_attempt) {
        $last = new DateTime($last_attempt);
        $diff = $now->getTimestamp() - $last->getTimestamp();
        if ($diff > ($LOCK_TIME_MINUTES * 60)) {
            $attempts = 0;
        }
    }

    // If password is correct
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
    $stmt = $conn->prepare("UPDATE $table SET login_attempts = ?, last_attempt = NOW() WHERE $user_col = ?");
    $stmt->bind_param("is", $attempts, $username);
    $stmt->execute();

    // Show error message
    http_response_code(200); // Always 200 to avoid console red errors
    header('Content-Type: application/json');

    if ($attempts >= $MAX_ATTEMPTS) {
        echo json_encode([
            "status" => "error",
            "message" => "You have reached 3 invalid attempts. Please reset your password via Forgot Password."
        ]);
        exit();
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "Invalid password. Attempt $attempts of $MAX_ATTEMPTS."
        ]);
        exit();
    }
}

// Check each role
$roles = [
    ["Admin", "ad_username", "ad_password", "ad_fname, ad_lname, ad_email, ad_phone"],
    ["OperationalManager", "manager_username", "manager_password", "manager_fname, manager_lname, manager_email, manager_phone"],
    ["DeliveryPersonnel", "pers_username", "pers_password", "pers_fname, pers_lname, pers_email, pers_phone, status, assignment_status"]
];

foreach ($roles as $r) {
    [$table, $user_col, $pass_col, $fields] = $r;
    $user = checkUser($conn, $table, $user_col, $pass_col, $fields);

    if ($user) {
        $_SESSION['user'] = $username;
        logLogin($username, $user['role'], [
            'fname' => $user[array_keys($user)[0]],
            'lname' => $user[array_keys($user)[1]],
            'email' => $user[array_keys($user)[2]]
        ]);
        echo json_encode(["status" => "success", "user" => $user]);
        exit();
    }
}

http_response_code(200); 
echo json_encode([
    "status" => "error",
    "message" => "Invalid username."
]);

$conn->close();
?>
