<?php
include 'database.php';

$allowed_origins = [
    "https://cessie840.github.io",
    "http://localhost:5173",
    "http://localhost:5173/Envirocool-Tracking-Page"
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


$data = json_decode(file_get_contents('php://input'), true);

$type_of_product = trim($data['type_of_product'] ?? '');
$description = trim($data['description'] ?? '');

if (empty($type_of_product)) {
    echo json_encode(["success" => false, "message" => "Product type is required"]);
    exit;
}

try {
    if ($description === '') {
      
        $stmt = $conn->prepare("DELETE FROM Product WHERE type_of_product = ?");
        $stmt->bind_param("s", $type_of_product);
    } else {
        $stmt = $conn->prepare("DELETE FROM Product WHERE type_of_product = ? AND description = ?");
        $stmt->bind_param("ss", $type_of_product, $description);
    }

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Deleted successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => $stmt->error]);
    }

    $stmt->close();
    $conn->close();

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
