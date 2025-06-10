<?php
$host = 'localhost';
$user = 'root';
$password = 'kurothecat';
$database = 'DeliveryTrackingSystem';
// $port = 3307;

$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
