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
$fileUpload = $_FILES["profile_pic"] ?? $_FILES["profilePic"] ?? null;

// ✅ Get personnel name
$stmt_name = $conn->prepare("SELECT pers_fname, pers_lname FROM DeliveryPersonnel WHERE pers_username = ?");
$stmt_name->bind_param("s", $username);
$stmt_name->execute();
$result = $stmt_name->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Personnel not found."]);
    exit;
}

$row = $result->fetch_assoc();
$fullName = trim($row["pers_fname"] . " " . $row["pers_lname"]);
$stmt_name->close();

// ✅ Prepare directory
$targetDir = __DIR__ . "/uploads/personnel_profile_pic/";
if (!file_exists($targetDir)) {
    mkdir($targetDir, 0777, true);
}

// ✅ Validate file
$allowedExts = ["jpg", "jpeg", "png", "gif"];
$newFileName = null;

if ($fileUpload && isset($fileUpload["tmp_name"]) && $fileUpload["tmp_name"] !== "") {
    $fileName = basename($fileUpload["name"]);
    $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

    if (!in_array($fileExt, $allowedExts)) {
        echo json_encode(["success" => false, "message" => "Invalid file type."]);
        exit;
    }

    // ✅ Use the naming pattern you wanted
    $cleanName = preg_replace('/[^A-Za-z0-9_]/', '_', $fullName);
    $newFileName = "personnel_profile_" . $cleanName . "." . $fileExt;
    $targetFile = $targetDir . $newFileName;

    // Overwrite existing file
    if (file_exists($targetFile)) unlink($targetFile);

    if (!move_uploaded_file($fileUpload["tmp_name"], $targetFile)) {
        echo json_encode(["success" => false, "message" => "Failed to move uploaded file."]);
        exit;
    }

    // ✅ Update DB
    $stmt = $conn->prepare("UPDATE DeliveryPersonnel SET pers_profile_pic = ? WHERE pers_username = ?");
    $stmt->bind_param("ss", $newFileName, $username);

    if ($stmt->execute()) {
        $response = [
            "success" => true,
            "message" => "Profile picture uploaded successfully.",
            "filename" => $newFileName,
            "image_url" => "http://localhost/DeliveryTrackingSystem/uploads/personnel_profile_pic/" . $newFileName
        ];
    } else {
        $response["message"] = "Database update failed.";
    }
    $stmt->close();
} else {
    $response["message"] = "No file uploaded.";
}

$conn->close();
echo json_encode($response);
?>