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

// ✅ Get personnel full name for filename
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


// ✅ Sanitize name for filename
$cleanName = preg_replace('/[^A-Za-z0-9_]/', '_', $fullName);

// ✅ Create uploads directory for personnel pictures
$targetDir = __DIR__ . "/personnel_profile_pic/";
if (!file_exists($targetDir)) {
    mkdir($targetDir, 0777, true);
}

$allowedExts = ["jpg", "jpeg", "png", "gif"];
$newFileName = null;

// ✅ Base filename (same for all updates — overwrite allowed)
$baseFileName = "profile_" . $cleanName;

// === CASE 1: Base64 upload ===
if ($imageData && preg_match('/^data:image\/(\w+);base64,/', $imageData, $type)) {
    $fileExt = strtolower($type[1]);
    if (!in_array($fileExt, $allowedExts)) {
        echo json_encode(["success" => false, "message" => "Invalid file type (base64)."]);
        exit;
    }

    $imageData = substr($imageData, strpos($imageData, ',') + 1);
    $imageData = base64_decode($imageData);
    if ($imageData === false) {
        echo json_encode(["success" => false, "message" => "Base64 decode failed."]);
        exit;
    }

    $newFileName = "{$baseFileName}.{$fileExt}";
    $targetFile = $targetDir . $newFileName;

    // Overwrite existing file if exists
    if (file_exists($targetFile)) {
        unlink($targetFile);
    }

    if (!file_put_contents($targetFile, $imageData)) {
        echo json_encode(["success" => false, "message" => "Failed to save base64 image."]);
        exit;
    }

// === CASE 2: Regular file upload ===
} elseif ($fileUpload && isset($fileUpload["tmp_name"]) && $fileUpload["tmp_name"] !== "") {
    $fileName = basename($fileUpload["name"]);
    $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

    if (!in_array($fileExt, $allowedExts)) {
        echo json_encode(["success" => false, "message" => "Invalid file type (file)."]);
        exit;
    }

    $newFileName = "{$baseFileName}.{$fileExt}";
    $targetFile = $targetDir . $newFileName;

    // Overwrite existing file if exists
    if (file_exists($targetFile)) {
        unlink($targetFile);
    }

    if (!move_uploaded_file($fileUpload["tmp_name"], $targetFile)) {
        echo json_encode(["success" => false, "message" => "Failed to move uploaded file."]);
        exit;
    }

} else {
    echo json_encode(["success" => false, "message" => "No file or image data received."]);
    exit;
}

// ✅ Update database (store filename only)
$stmt = $conn->prepare("UPDATE DeliveryPersonnel SET pers_profile_pic = ? WHERE pers_username = ?");
if (!$stmt) {
    echo json_encode(["success" => false, "message" => "SQL prepare failed: " . $conn->error]);
    exit;
}
$stmt->bind_param("ss", $newFileName, $username);

if ($stmt->execute()) {
    $response = [
        "success" => true,
        "message" => "Profile picture uploaded successfully.",
        "filename" => $newFileName,
        "image_url" => "http://localhost/DeliveryTrackingSystem/personnel_profile_pic/" . $newFileName
    ];
} else {
    $response = ["success" => false, "message" => "Database update failed: " . $stmt->error];
}

$stmt->close();
$conn->close();

echo json_encode($response);
exit;
?>
