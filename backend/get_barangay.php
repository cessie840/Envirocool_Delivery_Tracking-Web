<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include 'database.php'; // your MySQLi connection

$city = $_GET['city'] ?? '';



$result = $conn->query("SELECT city_name, barangay_name FROM laguna ORDER BY city_name, barangay_name");
$data = [];

while ($row = $result->fetch_assoc()) {
    $city = $row['city_name'];
    $barangay = $row['barangay_name'];
    if (!isset($data[$city])) {
        $data[$city] = [];
    }
    $data[$city][] = $barangay;
}

echo json_encode($data);

?>
