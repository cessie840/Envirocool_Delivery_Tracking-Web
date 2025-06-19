<?php
// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: http://localhost:5173");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Max-Age: 86400");
    http_response_code(200);
    exit();
}

// Main POST headers
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include 'database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Invalid request method"]);
    exit();
}

$input = json_decode(file_get_contents("php://input"), true);
if (!$input) {
    echo json_encode(["status" => "error", "message" => "Invalid JSON body"]);
    exit();
}

// Required fields
$requiredFields = ['firstName', 'lastName', 'gender', 'birthdate', 'age', 'contactNumber', 'email'];

foreach ($requiredFields as $field) {
    if (empty($input[$field])) {
        echo json_encode(["status" => "error", "message" => "Missing required field: $field"]);
        exit();
    }
}

// Sanitize input
$fname   = trim($input['firstName']);
$lname   = trim($input['lastName']);
$gender  = trim($input['gender']);
$birth   = trim($input['birthdate']); // Format should be YYYY-MM-DD
$age     = intval($input['age']);
$phone   = trim($input['contactNumber']);
$email   = trim($input['email']);
$profilePicName = 'uploads/default-profile-pic.png';// Default profile picture
$status = 'active';

// Validate formats
if (!preg_match("/^09\d{9}$/", $phone)) {
    echo json_encode(["status" => "invalid_contact"]);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["status" => "invalid_email"]);
    exit();
}

if ($age < 18) {
    echo json_encode(["status" => "age_restriction"]);
    exit();
}

// Check if account already exists by email AND first + last name
$stmt = $conn->prepare("SELECT * FROM DeliveryPersonnel WHERE pers_email = ? OR (pers_fname = ? AND pers_lname = ?)");
$stmt->bind_param("sss", $email, $fname, $lname);
$stmt->execute();
$result = $stmt->get_result();
if ($result->num_rows > 0) {
    echo json_encode([
        "status" => "existing_account",
        "message" => "An account with the same email or full name already exists."
    ]);
    $stmt->close();
    exit();
}
$stmt->close();

// Generate new unique username
$result = $conn->query("SELECT COUNT(*) AS count FROM DeliveryPersonnel");
$row = $result->fetch_assoc();
$count = $row['count'] + 1;
$username = 'personnel' . str_pad($count, 2, '0', STR_PAD_LEFT);

// Generate password from birthdate (plaintext)
$passwordPlain = $birth;
$passwordHashed = password_hash($passwordPlain, PASSWORD_BCRYPT);

// Insert new personnel
$stmt = $conn->prepare("INSERT INTO DeliveryPersonnel (
    pers_username, pers_password, pers_fname, pers_lname,
    pers_age, pers_gender, pers_birth, pers_phone, pers_email,
    pers_profile_pic, status
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

$stmt->bind_param(
    "ssssissssss",
    $username, $passwordHashed, $fname, $lname,
    $age, $gender, $birth, $phone, $email,
    $profilePicName, $status
);

if ($stmt->execute()) {
    echo json_encode([
        "status" => "success",
        "username" => $username,
        "password" => $passwordPlain
    ]);
} else {
    echo json_encode([
        "status" => "db_error",
        "message" => $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>
