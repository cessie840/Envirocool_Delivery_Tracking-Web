<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include 'database.php';

$sql = "SELECT type_of_product, description, unit_cost 
        FROM Product 
        ORDER BY type_of_product ASC, description ASC";

$result = $conn->query($sql);

$grouped = [];
while ($row = $result->fetch_assoc()) {
    $type = $row['type_of_product'];

    if (!isset($grouped[$type])) {
        $grouped[$type] = [];
    }

    $grouped[$type][] = [
        "label" => $row['description'],
        "value" => $row['description'],
        "unit_cost" => floatval($row['unit_cost']) 
    ];
}

echo json_encode($grouped);
$conn->close();
?>