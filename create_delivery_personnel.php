<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include 'database.php';

try {
    $data = json_decode(file_get_contents("php://input"), true);

    $contact = $data['contactNumber'] ?? '';
    $email = $data['email'] ?? '';
    $age = isset($data['age']) ? (int)$data['age'] : 0;

    // Contact number validation
    if (!preg_match('/^09\d{9}$/', $contact)) {
        echo json_encode([
            'status' => 'invalid_contact',
            'message' => 'Invalid contact number. Must start with 09 and be exactly 11 digits.'
        ]);
        exit;
    }

    // Email format validation
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode([
            'status' => 'invalid_email',
            'message' => 'Invalid email format.'
        ]);
        exit;
    }

    // Age validation
    if ($age < 18) {
        echo json_encode([
            'status' => 'age_restriction',
            'message' => 'Age must be 18 years old or above.'
        ]);
        exit;
    }

    // Check if email already exists
    $emailCheck = $conn->prepare("SELECT pers_username FROM DeliveryPersonnel WHERE pers_email = ?");
    $emailCheck->bind_param("s", $email);
    $emailCheck->execute();
    $emailCheck->store_result();

    if ($emailCheck->num_rows > 0) {
        echo json_encode([
            'status' => 'email_exists',
            'message' => 'Email is already registered.'
        ]);
        exit;
    }
    $emailCheck->close();

    // Get last username to generate next one
    $result = $conn->query("SELECT pers_username FROM DeliveryPersonnel ORDER BY pers_username DESC LIMIT 1");
    $lastUser = $result->fetch_assoc();

    if ($lastUser && preg_match('/^deliverypers(\d{3})$/', $lastUser['pers_username'], $matches)) {
        $lastNumber = (int)$matches[1];
        $nextNum = str_pad($lastNumber + 1, 3, "0", STR_PAD_LEFT);
    } else {
        $nextNum = "001";
    }

    $newUsername = "deliverypers" . $nextNum;

    // Hash the birthdate as password
    $rawPassword = $data['birthdate'];
    $hashedPassword = password_hash($rawPassword, PASSWORD_BCRYPT);

    $defaultProfilePic = 'uploads/default-profile-pic.png';

    // Prepare insert statement
    $stmt = $conn->prepare("INSERT INTO DeliveryPersonnel (
        pers_username, pers_password, pers_fname, pers_lname,
        pers_age, pers_birth, pers_phone, pers_email, status, pers_profile_pic
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)");

    $stmt->bind_param(
        "ssssissss",
        $newUsername,
        $hashedPassword,
        $data['firstName'],
        $data['lastName'],
        $age,
        $data['birthdate'],
        $contact,
        $email,
        $defaultProfilePic
    );

    // Execute and check result
    if ($stmt->execute()) {
        echo json_encode([
            'status' => 'success',
            'message' => 'Account created successfully.',
            'username' => $newUsername,
            'profile_picture' => $defaultProfilePic
        ]);
    } else {
        echo json_encode([
            'status' => 'db_error',
            'message' => 'Failed to insert record: ' . $stmt->error
        ]);
    }

    $stmt->close();
    $conn->close();

} catch (Exception $e) {
    echo json_encode([
        'status' => 'general_error',
        'message' => 'Unexpected error: ' . $e->getMessage()
    ]);
}
