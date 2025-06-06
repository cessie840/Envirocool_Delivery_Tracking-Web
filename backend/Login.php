<?php
include 'database.php';

header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

$stmt = $conn->prepare("SELECT ad_password FROM Admin WHERE ad_username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $row = $result->fetch_assoc();
    if (password_verify($password, $row['ad_password'])) {
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "incorrect_password"]);
    }
} else {
    echo json_encode(["status" => "user_not_found"]);
}

$stmt->close();
$conn->close();
?>
