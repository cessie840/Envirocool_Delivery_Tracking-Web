<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Content-Type: application/json");
include 'database.php';

$sql = "SELECT pers_username, pers_fname, pers_lname FROM DeliveryPersonnel WHERE status = 'active'";
$result = $conn->query($sql);

$personnel = [];

while ($row = $result->fetch_assoc()) {
    $personnel[] = $row;
}

echo json_encode($personnel);
?>
