<?php
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: http://localhost:5173");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    exit(0);
}

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

session_start();
include 'database.php';

if (!isset($_SESSION['manager_username'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$old_username = $_SESSION['manager_username'];

$data = json_decode(file_get_contents("php://input"), true);

$new_username = $data['manager_username'];
$manager_fname = $data['manager_fname'];
$manager_lname = $data['manager_lname'];
$manager_email = $data['manager_email'];
$manager_phone = $data['manager_phone'];

$sql = "UPDATE OperationalManager 
        SET manager_username = ?, manager_fname = ?, manager_lname = ?, manager_email = ?, manager_phone = ?
        WHERE manager_username = ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param("ssssss", $new_username, $manager_fname, $manager_lname, $manager_email, $manager_phone, $old_username);

if ($stmt->execute() && $stmt->affected_rows > 0) {
    $_SESSION['manager_username'] = $new_username;
    session_write_close(); 


echo json_encode([
  "success" => true,
  "new_username" => $new_username
]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Update failed"]);
}
?>
