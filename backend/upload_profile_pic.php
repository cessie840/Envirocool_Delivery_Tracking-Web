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

$imageData = $_POST["profile_pic"] ?? null;
$fileUpload = $_FILES["profile_pic"] ?? null;

$targetDir = __DIR__ . "/uploads/";
if (!file_exists($targetDir)) {
    mkdir($targetDir, 0777, true);
}

$allowedExts = ["jpg", "jpeg", "png", "gif"];
$newFileName = null;

if ($imageData && preg_match('/^data:image\/(\w+);base64,/', $imageData, $type)) {
    $fileExt = strtolower($type[1]);
    if (!in_array($fileExt, $allowedExts)) {
        $response["message"] = "Invalid file type (base64).";
        echo json_encode($response);
        exit;
    }

    $imageData = substr($imageData, strpos($imageData, ',') + 1);
    $imageData = base64_decode($imageData);
    if ($imageData === false) {
        $response["message"] = "Base64 decode failed.";
        echo json_encode($response);
        exit;
    }

    $newFileName = uniqid("profile_", true) . "." . $fileExt;
    $targetFile = $targetDir . $newFileName;
    if (!file_put_contents($targetFile, $imageData)) {
        $response["message"] = "Failed to save base64 image.";
        echo json_encode($response);
        exit;
    }

} elseif ($fileUpload && isset($fileUpload["tmp_name"]) && $fileUpload["tmp_name"] !== "") {
    $fileName = basename($fileUpload["name"]);
    $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

    if (!in_array($fileExt, $allowedExts)) {
        $response["message"] = "Invalid file type (file).";
        echo json_encode($response);
        exit;
    }

    $newFileName = uniqid("profile_", true) . "." . $fileExt;
    $targetFile = $targetDir . $newFileName;

    if (!move_uploaded_file($fileUpload["tmp_name"], $targetFile)) {
        $response["message"] = "Failed to move uploaded file.";
        echo json_encode($response);
        exit;
    }

} else {
    $response["message"] = "No file or image data received.";
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
    $response["filename"] = $newFileName;
    $response["image_url"] = "http://localhost/DeliveryTrackingSystem/uploads/" . $newFileName;
} else {
    $response["message"] = "Database update failed: " . $stmt->error;
}

$stmt->close();
$conn->close();

echo json_encode($response);
exit;
?>
