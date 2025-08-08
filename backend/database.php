<?php
$host = 'localhost';
$user = 'cess';
$password = 'cezzmabangiz';
$database = 'DeliveryTrackingSystem';


$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
