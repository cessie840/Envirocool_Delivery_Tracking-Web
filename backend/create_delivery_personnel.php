<?php
// Allowed origins
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'database.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer/PHPMailer.php';
require 'PHPMailer/SMTP.php';
require 'PHPMailer/Exception.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Invalid request method"]);
    exit();
}

$input = json_decode(file_get_contents("php://input"), true);
if (!$input) {
    echo json_encode(["status" => "error", "message" => "Invalid JSON body"]);
    exit();
}

$requiredFields = ['firstName', 'lastName', 'gender', 'birthdate', 'age', 'contactNumber', 'email'];
foreach ($requiredFields as $field) {
    if (empty($input[$field])) {
        echo json_encode(["status" => "error", "message" => "Missing required field: $field"]);
        exit();
    }
}

$fname   = trim($input['firstName']);
$lname   = trim($input['lastName']);
$gender  = trim($input['gender']);
$birth   = trim($input['birthdate']);
$age     = intval($input['age']);
$phone   = trim($input['contactNumber']);
$email   = trim($input['email']);

$profilePicName = 'uploads/default-profile-pic.png';
$status = 'Active';

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


$stmt = $conn->prepare("SELECT * FROM DeliveryPersonnel WHERE pers_email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();
if ($result->num_rows > 0) {
    echo json_encode(["status" => "email_exists", "message" => "This email is already in use."]);
    $stmt->close();
    exit();
}
$stmt->close();

$result = $conn->query("SELECT COUNT(*) AS count FROM DeliveryPersonnel");
$row = $result->fetch_assoc();
$count = $row['count'] + 1;
$username = 'personnel' . str_pad($count, 2, '0', STR_PAD_LEFT);
$passwordPlain = $birth;
$passwordHash = password_hash($passwordPlain, PASSWORD_DEFAULT);

$stmt = $conn->prepare("INSERT INTO DeliveryPersonnel (
    pers_username, pers_password, pers_fname, pers_lname,
    pers_age, pers_gender, pers_birth, pers_phone, pers_email,
    pers_profile_pic, status
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

$stmt->bind_param(
    "ssssissssss",
    $username, $passwordHash, $fname, $lname,
    $age, $gender, $birth, $phone, $email,
    $profilePicName, $status
);

if ($stmt->execute()) {

    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'contactenvirocool@gmail.com';
        $mail->Password   = 'jvjvojduhrcglehv'; 
        $mail->SMTPSecure = 'tls';
        $mail->Port       = 587;

        $mail->setFrom('contactenvirocool@gmail.com', 'EnviroCool Operational Manager');
        $mail->addAddress($email, $fname . ' ' . $lname);

        $mail->isHTML(true);
        $mail->Subject = 'EnviroCool Delivery Account Created';
        $mail->Body = "
            <p>Hello <strong>{$fname} {$lname}</strong>,</p>
            <p>Welcome to <strong>EnviroCool Delivery Tracking System</strong>!</p>
            <p>Your delivery personnel account has been successfully created. Please use the credentials below to log in:</p>

            <table border='1' cellpadding='6' style='border-collapse: collapse;'>
                <tr><td><strong>Username:</strong></td><td>{$username}</td></tr>
                <tr><td><strong>Password:</strong></td><td>{$passwordPlain}</td></tr>
            </table>

            <p>Your default profile picture has been set automatically. You can change it later in your profile settings.</p>
            <p>For security reasons, please change your password upon your first login.</p>
            <br>
            <p>Best regards,</p>
            <p><strong>EnviroCool Team</strong></p>
        ";

        $mail->send();

        echo json_encode([
            "status" => "success",
            "username" => $username,
            "password" => $passwordPlain,
            "message" => "Account created successfully. Credentials sent to email."
        ]);
    } catch (Exception $e) {
        echo json_encode([
            "status" => "email_failed",
            "username" => $username,
            "password" => $passwordPlain,
            "message" => "Account created but email failed: " . $mail->ErrorInfo
        ]);
    }
} else {
    echo json_encode([
        "status" => "db_error",
        "message" => $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>