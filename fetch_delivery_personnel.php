<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Content-Type: application/json");
error_reporting(E_ALL);
ini_set('display_errors', 1);

include 'database.php';

$sql = "SELECT pers_username, pers_fname, pers_lname 
        FROM DeliveryPersonnel 
        WHERE status = 'Active' AND assignment_status = 'Available'";

$result = $conn->query($sql);

$personnel = [];

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $personnel[] = $row;
    }
}

echo json_encode($personnel);
?>
