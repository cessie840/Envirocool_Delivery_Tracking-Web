<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include 'database.php';

$sql = "SELECT DISTINCT type_of_product FROM Product ORDER BY type_of_product ASC";
$result = $conn->query($sql);

$types = [];
while ($row = $result->fetch_assoc()) {
    $types[] = [
        "label" => $row['type_of_product'],
        "value" => $row['type_of_product']
    ];
}

echo json_encode($types);
$conn->close();
?>
