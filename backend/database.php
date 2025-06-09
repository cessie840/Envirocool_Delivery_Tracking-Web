<?php
$host = 'localhost:3307';
$user = 'cess';
$password = 'pass';
$database = 'DeliveryTrackingSystem';


$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
