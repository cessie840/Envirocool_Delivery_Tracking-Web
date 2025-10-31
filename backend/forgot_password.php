<?php
include 'database.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer/PHPMailer.php';
require 'PHPMailer/SMTP.php';
require 'PHPMailer/Exception.php';

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);
$emailInput = trim($data['email']);

if (!filter_var($emailInput, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["status" => "invalid_email", "message" => "Invalid email format."]);
    exit;
}

$found = false;
$username = "";
$table = "";

$tablesToCheck = [
    "Admin" => ["username_col" => "ad_username", "email_col" => "ad_email"],
    "OperationalManager" => ["username_col" => "manager_username", "email_col" => "manager_email"],
    "DeliveryPersonnel" => ["username_col" => "pers_username", "email_col" => "pers_email"]
];

foreach ($tablesToCheck as $tableName => $cols) {
    $stmt = $conn->prepare("SELECT {$cols['username_col']} FROM $tableName WHERE {$cols['email_col']} = ?");
    $stmt->bind_param("s", $emailInput);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();
        $username = $user[$cols['username_col']];
        $table = $tableName;
        $email_col = $cols['email_col'];
        $found = true;
        $stmt->close();
        break;
    }
    $stmt->close();
}

if (!$found) {
    echo json_encode(["status" => "user_not_found", "message" => "Email not found in any user role."]);
    $conn->close();
    exit;
}


$lockCheckStmt = $conn->prepare("SELECT lock_until FROM $table WHERE $email_col = ?");
$lockCheckStmt->bind_param("s", $emailInput);
$lockCheckStmt->execute();
$lockResult = $lockCheckStmt->get_result();

if ($lockResult->num_rows === 1) {
    $lockData = $lockResult->fetch_assoc();
    $lockedUntil = $lockData['lock_until'];

    if (!empty($lockedUntil) && strtotime($lockedUntil) > time()) {
        echo json_encode([
            "status" => "locked",
            "message" => "Too many failed attempts. Try again after 5 minutes."
        ]);
        $lockCheckStmt->close();
        $conn->close();
        exit;
    }
}
$lockCheckStmt->close();


$token = strtoupper(bin2hex(random_bytes(3))); 
$reset_expire = date("Y-m-d H:i:s", strtotime("+5 minutes"));
$reset_requested_at = date("Y-m-d H:i:s");


switch ($table) {
    case "Admin":
        $updateStmt = $conn->prepare("UPDATE Admin SET ad_resetToken = ?, reset_expire = ?, reset_requested_at = ? WHERE ad_email = ?");
        break;
    case "OperationalManager":
        $updateStmt = $conn->prepare("UPDATE OperationalManager SET   manager_resetToken = ?, reset_expire = ?, reset_requested_at = ? WHERE manager_email = ?");
        break;
    case "DeliveryPersonnel":
        $updateStmt = $conn->prepare("UPDATE DeliveryPersonnel SET pers_resetToken = ?, reset_expire = ?, reset_requested_at = ? WHERE pers_email = ?");
        break;

}

$updateStmt->bind_param("ssss", $token, $reset_expire, $reset_requested_at, $emailInput);
$updateSuccess = $updateStmt->execute();
$updateStmt->close();

if (!$updateSuccess) {
    echo json_encode(["status" => "db_error", "message" => "Failed to save token to DB."]);
    $conn->close();
    exit;
}

$user_col = match ($table) {
    "Admin" => "ad_username",
    "OperationalManager" => "manager_username",
    "DeliveryPersonnel" => "pers_username",
};

$update = $conn->prepare("UPDATE $table SET login_attempts = 0, last_attempt = NULL WHERE BINARY $user_col = ?");
$update->bind_param("s", $username);
$update->execute();
$update->close();

$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'contactenvirocool@gmail.com';
    $mail->Password = 'jvjvojduhrcglehv';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;

    $isLocal = in_array($_SERVER['SERVER_NAME'], ['localhost', '127.0.0.1']);
    if ($isLocal) {
        $mail->SMTPOptions = [
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true,
            ],
        ];
    }

    $mail->setFrom('contactenvirocool@gmail.com', 'EnviroCool Support');
    $mail->addAddress($emailInput, $username);

    $mail->isHTML(true);
    $mail->Subject = 'EnviroCool Password Reset Code';
    $mail->Body = "
        <p>Hello <strong>$username</strong>,</p>
        <p>Your password reset code is:</p>
        <h2 style='color:#28a745;'>$token</h2>
        <p>This code will expire in <strong>5 minutes</strong>.</p>
        <p>If you didn't request a reset, please ignore this message.</p>
        <br><p>– EnviroCool Team</p>
    ";

    $mail->send();
    echo json_encode(["status" => "success", "message" => "Reset code sent."]);
} catch (Exception $e) {
    echo json_encode([
        "status" => "email_failed",
        "message" => "Mailer Error: " . $mail->ErrorInfo,
    ]);
}


$conn->close();
?>