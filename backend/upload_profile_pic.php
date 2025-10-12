<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

include 'db_connection.php'; // <-- your connection file

if (!isset($_FILES['profilePic']) || !isset($_POST['username'])) {
    echo json_encode(["success" => false, "message" => "Invalid request"]);
    exit;
}

$username = $_POST['username'];
$file = $_FILES['profilePic'];

$targetDir = "uploads/";
$ext = pathinfo($file["name"], PATHINFO_EXTENSION);
$fileName = "profile_" . $username . "_" . time() . "." . $ext;
$targetFilePath = $targetDir . $fileName;

if (move_uploaded_file($file["tmp_name"], $targetFilePath)) {
    // Save the file path to the database
    $query = "UPDATE delivery_personnel SET pers_profile_pic = ? WHERE pers_username = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ss", $targetFilePath, $username);

    if ($stmt->execute()) {
        echo json_encode([
            "success" => true,
            "filePath" => "http://localhost/DeliveryTrackingSystem/" . $targetFilePath
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update database"]);
    }
    $stmt->close();
} else {
    echo json_encode(["success" => false, "message" => "Failed to upload file"]);
}

$conn->close();
?>
