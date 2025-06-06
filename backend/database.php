<?php
$host = 'localhost';
$user = 'root';
$password = 'liezel11';
$database = 'DeliveryTrackingSystem';


$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
