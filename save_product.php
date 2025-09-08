<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");


if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'database.php';

$data = json_decode(file_get_contents("php://input"), true);

$type_of_product = trim($data["type_of_product"] ?? "");
$description = trim($data["description"] ?? "");
$unit_cost = $data["unit_cost"] ?? 0;

if (empty($type_of_product) || empty($description)) {
    echo json_encode(["success" => false, "message" => "Product type and item name are required"]);
    exit;
}


$normalized_type = strtolower($type_of_product);
$normalized_desc = strtolower($description);


$check = $conn->prepare("SELECT product_id 
                         FROM Product 
                         WHERE LOWER(TRIM(type_of_product)) = ? 
                           AND LOWER(TRIM(description)) = ?");
$check->bind_param("ss", $normalized_type, $normalized_desc);
$check->execute();
$check->store_result();

if ($check->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "This item already exists for the selected product type"]);
    exit;
}

$stmt = $conn->prepare("INSERT INTO Product (type_of_product, description, unit_cost) VALUES (?, ?, ?)");
$stmt->bind_param("ssd", $type_of_product, $description, $unit_cost);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Product saved"]);
} else {
    echo json_encode(["success" => false, "message" => "Error: " . $conn->error]);
}

$stmt->close();
$conn->close();
?>
