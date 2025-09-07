<?php
require_once "database.php";

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle OPTIONS preflight
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit(0);
}

// Read JSON input
$data = json_decode(file_get_contents("php://input"), true);

$trackingNumber = isset($data["tracking_number"]) ? trim($data["tracking_number"]) : "";
$rating = isset($data["rating"]) ? floatval($data["rating"]) : 0;
$feedback = isset($data["feedback"]) ? trim($data["feedback"]) : "";

if (empty($trackingNumber) || $rating <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "Tracking number and rating are required."
    ]);
    exit;
}

// Update the transaction with rating + feedback
$sql = "UPDATE Transactions 
        SET customer_rating = ?, cancelled_reason = ? 
        WHERE tracking_number = ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param("dss", $rating, $feedback, $trackingNumber);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Feedback submitted successfully."
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Failed to save feedback."
    ]);
}

$stmt->close();
$conn->close();
