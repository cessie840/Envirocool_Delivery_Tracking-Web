<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Content-Type: application/json");
include 'database.php';

// Select only active personnel who are NOT already assigned
$sql = "
    SELECT dp.pers_username, dp.pers_fname, dp.pers_lname
    FROM DeliveryPersonnel dp
    WHERE dp.status = 'active'
    AND dp.pers_username NOT IN (
        SELECT personnel_username FROM DeliveryAssignments
    )
";

$result = $conn->query($sql);
$personnel = [];

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $personnel[] = $row;
    }
}

echo json_encode($personnel);
?>
