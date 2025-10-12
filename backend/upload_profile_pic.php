<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once "database.php";


$response = ["success" => false, "message" => "Unknown error"];

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    $response["message"] = "Invalid request method.";
    echo json_encode($response);
    exit;
}

if (empty($_POST["pers_username"])) {
    $response["message"] = "Missing user identifier (pers_username).";
    echo json_encode($response);
    exit;
}

$username = $_POST["pers_username"];

if (!isset($_FILES["profile_pic"])) {
    $response["message"] = "No file received.";
    echo json_encode($response);
    exit;
}

$fileError = $_FILES["profile_pic"]["error"];
if ($fileError !== UPLOAD_ERR_OK) {
    $response["message"] = "File upload error code: " . $fileError;
    echo json_encode($response);
    exit;
}

$targetDir = __DIR__ . "/uploads/";
if (!file_exists($targetDir)) {
    mkdir($targetDir, 0777, true);
}

$fileName = basename($_FILES["profile_pic"]["name"]);
$fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
$allowedExts = ["jpg", "jpeg", "png", "gif"];

if (!in_array($fileExt, $allowedExts)) {
    $response["message"] = "Invalid file type. Only JPG, JPEG, PNG, GIF allowed.";
    echo json_encode($response);
    exit;
}

$newFileName = uniqid("profile_", true) . "." . $fileExt;
$targetFile = $targetDir . $newFileName;

if (!move_uploaded_file($_FILES["profile_pic"]["tmp_name"], $targetFile)) {
    $response["message"] = "Failed to move uploaded file.";
    echo json_encode($response);
    exit;
}

$stmt = $conn->prepare("UPDATE DeliveryPersonnel SET pers_profile_pic = ? WHERE pers_username = ?");
if (!$stmt) {
    $response["message"] = "SQL prepare failed: " . $conn->error;
    echo json_encode($response);
    exit;
}

$stmt->bind_param("ss", $newFileName, $username);
if ($stmt->execute()) {
    $response["success"] = true;
    $response["message"] = "Profile picture uploaded successfully.";
    $response["image_url"] = "http://localhost/DeliveryTrackingSystem/uploads/" . $newFileName;
} else {
    $response["message"] = "Database update failed: " . $stmt->error;
}

$stmt->close();
$conn->close();

echo json_encode($response);
exit;
?>
