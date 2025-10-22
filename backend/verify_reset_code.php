<?php
include 'database.php';

header("Access-Control-Allow-Origin: http://localhost:5173");
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
    "Admin" => [
        "email_col" => "ad_email",
        "token_col" => "ad_resetToken",
        "expire_col" => "reset_expire",
        "attempt_col" => "attempts",
        "lock_col" => "lock_until"
    ],
    "OperationalManager" => [
        "email_col" => "manager_email",
        "token_col" => "manager_resetToken",
        "expire_col" => "reset_expire",
        "attempt_col" => "attempts",
        "lock_col" => "lock_until"
    ],
    "DeliveryPersonnel" => [
        "email_col" => "pers_email",
        "token_col" => "pers_resetToken",
        "expire_col" => "reset_expire",
        "attempt_col" => "attempts",
        "lock_col" => "lock_until"
    ]
];

$matched = false;

foreach ($tablesToCheck as $table => $cols) {
    $stmt = $conn->prepare("
        SELECT {$cols['token_col']}, {$cols['expire_col']}, {$cols['attempt_col']}, {$cols['lock_col']} 
        FROM $table 
        WHERE {$cols['email_col']} = ?
    ");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $row = $result->fetch_assoc();
        $dbToken = $row[$cols['token_col']];
        $expire = $row[$cols['expire_col']];
        $attempts = (int)$row[$cols['attempt_col']];
        $lockUntil = $row[$cols['lock_col']];

        // Check if locked
        if ($lockUntil && strtotime($lockUntil) > time()) {
            echo json_encode([
                "status" => "locked",
                "message" => "Too many failed attempts. Try again after " . date("g:i A", strtotime($lockUntil))
            ]);
            $conn->close();
            exit;
        }

        if ($code === $dbToken) {
            // Valid code
            $clear = $conn->prepare("UPDATE $table SET {$cols['attempt_col']} = 0, {$cols['lock_col']} = NULL WHERE {$cols['email_col']} = ?");
            $clear->bind_param("s", $email);
            $clear->execute();
            $clear->close();

            if (strtotime($expire) < time()) {
                echo json_encode(["status" => "expired", "message" => "Code has expired."]);
            } else {
                echo json_encode(["status" => "verified", "message" => "Code is correct."]);
            }
        } else {
            // Invalid code
            $attempts++;
            if ($attempts >= $maxAttempts) {
            $lockTime = date("Y-m-d H:i:s", strtotime("+5 minutes"));

                $lockStmt = $conn->prepare("
                    UPDATE $table 
                    SET {$cols['attempt_col']} = ?, {$cols['lock_col']} = ? 
                    WHERE {$cols['email_col']} = ?
                ");
                $lockStmt->bind_param("iss", $attempts, $lockTime, $email);
                $lockStmt->execute();
                $lockStmt->close();

                echo json_encode([
                    "status" => "locked",
                    "message" => "Too many failed attempts. Try again after 5 minutes."
                ]);
            } else {
                $update = $conn->prepare("
                    UPDATE $table 
                    SET {$cols['attempt_col']} = ? 
                    WHERE {$cols['email_col']} = ?
                ");
                $update->bind_param("is", $attempts, $email);
                $update->execute();
                $update->close();

                $remaining = $maxAttempts - $attempts;
                echo json_encode([
                    "status" => "invalid_code",
                    "message" => "Incorrect code. Attempts left: $remaining"
                ]);
            }
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
