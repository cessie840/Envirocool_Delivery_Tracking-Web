<?php
include 'database.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);
$email = trim($data['email']);
$code = strtoupper(trim($data['code'])); 
$maxAttempts = 3;

if (!$email || !$code) {
    echo json_encode(["status" => "missing_fields", "message" => "Email and code are required."]);
    exit;
}

$tablesToCheck = [
    "Admin" => ["email_col" => "ad_email", "token_col" => "ad_resetToken", "expire_col" => "reset_expire", "attempt_col" => "attempts"],
    "OperationalManager" => ["email_col" => "manager_email", "token_col" => "om_resetToken", "expire_col" => "reset_expire", "attempt_col" => "attempts"]
];

$matched = false;

foreach ($tablesToCheck as $table => $cols) {
    $stmt = $conn->prepare("SELECT {$cols['token_col']}, {$cols['expire_col']}, {$cols['attempt_col']} FROM $table WHERE {$cols['email_col']} = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $row = $result->fetch_assoc();
        $dbToken = $row[$cols['token_col']];
        $expire = $row[$cols['expire_col']];
        $attempts = (int)$row[$cols['attempt_col']];

        if ($attempts >= $maxAttempts) {
            // Reset token and attempts
            $newToken = strtoupper(bin2hex(random_bytes(3)));
            $newExpire = date("Y-m-d H:i:s", strtotime("+15 minutes"));
            $reset = $conn->prepare("UPDATE $table SET {$cols['token_col']} = ?, {$cols['expire_col']} = ?, {$cols['attempt_col']} = 0 WHERE {$cols['email_col']} = ?");
            $reset->bind_param("sss", $newToken, $newExpire, $email);
            $reset->execute();
            $reset->close();

            echo json_encode(["status" => "resend", "message" => "Too many failed attempts. A new code has been sent."]);
            $conn->close();
            exit;
        }

        if ($code === $dbToken) {
      
            $clear = $conn->prepare("UPDATE $table SET {$cols['attempt_col']} = 0 WHERE {$cols['email_col']} = ?");
            $clear->bind_param("s", $email);
            $clear->execute();
            $clear->close();

          
            if (strtotime($expire) < time()) {
                echo json_encode(["status" => "expired", "message" => "Code has expired."]);
            } else {
                echo json_encode(["status" => "verified", "message" => "Code is correct."]);
            }
        } else {
          
            $attempts++;
            $update = $conn->prepare("UPDATE $table SET {$cols['attempt_col']} = ? WHERE {$cols['email_col']} = ?");
            $update->bind_param("is", $attempts, $email);
            $update->execute();
            $update->close();

            $remaining = $maxAttempts - $attempts;
            echo json_encode(["status" => "invalid_code", "message" => "Incorrect code. Attempts left: $remaining"]);
        }

        $matched = true;
        break;
    }

    $stmt->close();
}

if (!$matched) {
    echo json_encode(["status" => "not_found", "message" => "Email not found."]);
}

$conn->close();

?>
