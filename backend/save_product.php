<?php
include 'database.php';

$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174', 'https://cessie840.github.io','https://envirocool-delivery-tracking-web.vercel.app'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$type_of_product = isset($data['type_of_product']) ? trim($data['type_of_product']) : '';
$description = isset($data['description']) ? trim($data['description']) : '';
$unit_cost = isset($data['unit_cost']) ? floatval($data['unit_cost']) : 0;


if (empty($type_of_product)) {
    echo json_encode(["success" => false, "message" => "Product type is required"]);
    exit;
}

$normalized_type = strtolower($type_of_product);
$normalized_desc = strtolower($description);

if(!empty($description)) {
    $check = $conn->prepare("SELECT product_id 
                             FROM Product 
                             WHERE LOWER(TRIM(type_of_product)) = ? 
                               AND LOWER(TRIM(description)) = ?");
    $check->bind_param("ss", $normalized_type, $normalized_desc);
} else {
    $check = $conn->prepare("SELECT product_id 
                             FROM Product 
                             WHERE LOWER(TRIM(type_of_product)) = ? 
                               AND (description IS NULL OR description = '')");
    $check->bind_param("s", $normalized_type);
}

$check->execute();
$check->store_result();

if ($check->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "Product type already exists"]);
    exit;
}

$insert = $conn->prepare("INSERT INTO Product (type_of_product, description, unit_cost) VALUES (?, ?, ?)");
$insert->bind_param("ssd", $type_of_product, $description, $unit_cost);

if ($insert->execute()) {
    echo json_encode(["success" => true, "message" => "Product saved successfully"]);
} else {
    echo json_encode(["success" => false, "message" => "Error saving product"]);
}

$conn->close();
