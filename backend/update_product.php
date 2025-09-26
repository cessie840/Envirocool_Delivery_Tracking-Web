<?php
include 'database.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

$type_of_product_new = trim($data['type_of_product_new'] ?? '');
$description_new = trim($data['description_new'] ?? '');
$type_of_product_current = trim($data['type_of_product_current'] ?? '');
$description_current = trim($data['description_current'] ?? '');

try {
    if (!empty($type_of_product_current) && !empty($type_of_product_new)) {
        $stmt = $conn->prepare("UPDATE Product SET type_of_product = ? WHERE type_of_product = ?");
        $stmt->bind_param("ss", $type_of_product_new, $type_of_product_current);
        $stmt->execute();
        $stmt->close();
    }

    if (!empty($description_current) && !empty($description_new)) {
       
        $current_type = $type_of_product_new ?: $type_of_product_current;

        $stmt = $conn->prepare("UPDATE Product SET description = ? WHERE description = ? AND type_of_product = ?");
        $stmt->bind_param("sss", $description_new, $description_current, $current_type);
        $stmt->execute();
        $stmt->close();
    }

    $conn->close();
    echo json_encode(["success" => true, "message" => "Updated successfully"]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
