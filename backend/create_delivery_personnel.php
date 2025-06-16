<?php
// Handle preflight request
$uploadDir = "uploads/";
$profilePicName = "";

if (isset($_FILES['profilePic']) && $_FILES['profilePic']['error'] === 0) {
    $ext = pathinfo($_FILES['profilePic']['name'], PATHINFO_EXTENSION);
    $profilePicName = uniqid("dp_") . "." . $ext;
    $uploadPath = $uploadDir . $profilePicName;

    // Optional: Create uploads directory if not exists
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    if (!move_uploaded_file($_FILES['profilePic']['tmp_name'], $uploadPath)) {
        echo json_encode(["status" => "error", "message" => "Failed to upload profile picture."]);
        exit();
    }
}

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

// Ensure request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Invalid request method"]);
    exit();
}

// Get input
$input = json_decode(file_get_contents("php://input"), true);
if (!$input) {
    echo json_encode(["status" => "error", "message" => "Invalid JSON body"]);
    exit();
}

// Validation
$requiredFields = ['firstName', 'lastName', 'gender', 'birthdate', 'age', 'contactNumber', 'email'];
foreach ($requiredFields as $field) {
    if (empty($input[$field])) {
        echo json_encode(["status" => "error", "message" => "Missing required field: $field"]);
        exit();
    }
}

$fname = trim($input['firstName']);
$lname = trim($input['lastName']);
$gender = trim($input['gender']);
$birth = trim($input['birthdate']);
$age = intval($input['age']);
$phone = trim($input['contactNumber']);
$email = trim($input['email']);

// Format validation
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

// Generate credentials
$username = strtolower($fname . $lname . rand(100, 999));
$passwordPlain = strtolower($lname . '@123');
$passwordHashed = password_hash($passwordPlain, PASSWORD_BCRYPT);

// Email check
$stmt = $conn->prepare("SELECT * FROM DeliveryPersonnel WHERE pers_email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();
if ($result->num_rows > 0) {
    echo json_encode(["status" => "email_exists"]);
    exit();
}
$stmt->close();

// Insert
$stmt = $conn->prepare("INSERT INTO DeliveryPersonnel (
    pers_username, pers_password, pers_fname, pers_lname, pers_age, pers_gender, pers_birth, pers_phone, pers_email, status
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

$status = "active";
$stmt->bind_param("ssssisssss", $username, $passwordHashed, $fname, $lname, $age, $gender, $birth, $phone, $email, $status);

if ($stmt->execute()) {
    echo json_encode(["status" => "success", "username" => $username, "defaultPassword" => $passwordPlain]);
} else {
    echo json_encode(["status" => "db_error", "message" => $stmt->error]);
}

$stmt->close();
$conn->close();
?>
