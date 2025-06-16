<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include 'database.php';

$sql = "SELECT 
            pers_fname,
            pers_lname,
            pers_username,
            pers_birth,
            pers_email
        FROM DeliveryPersonnel
        WHERE status = 'active'";

   
$result = $conn->query($sql);

$personnel = [];

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $personnel[] = $row;
    }
}

echo json_encode($personnel);

?>