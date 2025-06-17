<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include 'database.php';

$sql = "SELECT 
            pers_fname,
            pers_lname,
            pers_username,
            pers_email,
            pers_birth AS pers_password
        FROM DeliveryPersonnel
        WHERE status = 'Active'";

$result = $conn->query($sql);

$personnel = [];

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $personnel[] = $row;
    }
}

echo json_encode($personnel);
?>
