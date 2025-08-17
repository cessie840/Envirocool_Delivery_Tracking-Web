<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Allowed origins
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include 'database.php';

$response = [
    "success" => false,
    "message" => "",
    "data" => []
];

try {
    $sql = "SELECT pers_username, pers_fname, pers_lname FROM DeliveryPersonnel";
    $result = $conn->query($sql);

    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $response["data"][] = [
    "pers_username" => $row["pers_username"],
    "pers_fname" => $row["pers_fname"],
    "pers_lname" => $row["pers_lname"]
];

        }
        $response["success"] = true;
        $response["message"] = "Delivery personnel fetched successfully.";
    } else {
        $response["message"] = "No delivery personnel found.";
    }
} catch (Exception $e) {
    $response["message"] = "Error: " . $e->getMessage();
}

echo json_encode($response);
$conn->close();
?>