<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST, GET");
header("Access-Control-Allow-Headers: Content-Type");

include 'database.php';

// DELETE mode if POST request is received
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->username) || empty($data->username)) {
        echo json_encode(["status" => "error", "message" => "Username is required."]);
        exit;
    }

    $username = $conn->real_escape_string($data->username);

    $deleteSql = "DELETE FROM DeliveryPersonnel WHERE pers_username = '$username'";
    if ($conn->query($deleteSql) === TRUE) {
        echo json_encode(["status" => "success", "message" => "Personnel deleted."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to delete personnel."]);
    }

    exit; 
}

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
