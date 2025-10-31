<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

include 'database.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['type']) || !isset($data['name'])) {
    echo json_encode(["success" => false, "message" => "Missing fields."]);
    exit;
}

$type = $data['type']; 
$name = trim($data['name']);
$city = isset($data['city']) ? trim($data['city']) : null;

try {
    if ($type === "city") {
        $check = $conn->prepare("SELECT city_id FROM location WHERE city_name = ?");
        $check->bind_param("s", $name);
        $check->execute();
        $result = $check->get_result();

        if ($result->num_rows === 0) {
            $stmt = $conn->prepare("INSERT INTO location (city_name) VALUES (?)");
            $stmt->bind_param("s", $name);
            $stmt->execute();
            echo json_encode(["success" => true, "message" => "New city added successfully."]);
        } else {
            echo json_encode(["success" => true, "message" => "City already exists."]);
        }
    }

    if ($type === "barangay") {
        if (!$city) {
            echo json_encode(["success" => false, "message" => "City name is required for barangay."]);
            exit;
        }
        $check = $conn->prepare("SELECT city_id FROM location WHERE city_name = ? AND barangay_name = ?");
        $check->bind_param("ss", $city, $name);
        $check->execute();
        $result = $check->get_result();

        if ($result->num_rows === 0) {
            $stmt = $conn->prepare("INSERT INTO location (city_name, barangay_name) VALUES (?, ?)");
            $stmt->bind_param("ss", $city, $name);
            $stmt->execute();
            echo json_encode(["success" => true, "message" => "New barangay added successfully."]);
        } else {
            echo json_encode(["success" => true, "message" => "Barangay already exists."]);
        }
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
