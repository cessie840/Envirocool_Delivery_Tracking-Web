<?php
$host = "localhost";
$db = "DeliveryTrackingSystem";
$user = "root";
$pass = "";

$conn = new mysqli($host, $user, $pass, $db);

//ERROR HANDLER - NO DATABASE CONNECTION
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed"]);
    exit();
}
?>