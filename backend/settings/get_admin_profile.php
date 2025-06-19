<?php
session_start();
include 'database.php'; // contains $conn

if (!isset($_SESSION['ad_username'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$username = $_SESSION['ad_username'];

$sql = "SELECT ad_fname, ad_lname, ad_email, ad_phone FROM Admin WHERE ad_username = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    echo json_encode($result->fetch_assoc());
} else {
    http_response_code(404);
    echo json_encode(["error" => "Admin not found"]);
}
?>
