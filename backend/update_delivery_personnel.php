<?php
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'database.php';

$pers_username = $_POST['pers_username'] ?? null;
$pers_fname    = $_POST['pers_fname'] ?? null;
$pers_lname    = $_POST['pers_lname'] ?? null;
$pers_email    = $_POST['pers_email'] ?? null;
$pers_phone    = $_POST['pers_phone'] ?? null;
$pers_password = $_POST['pers_password'] ?? null;
$pers_age      = $_POST['pers_age'] ?? null;
$pers_gender   = $_POST['pers_gender'] ?? null;
$pers_birth    = $_POST['pers_birthday'] ?? null;

if (!$pers_username) {
    echo json_encode(["success" => false, "message" => "Missing username"]);
    exit;
}

$profile_pic_filename = null;
if (isset($_FILES['profilePic']) && $_FILES['profilePic']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = __DIR__ . "/uploads/";
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    $ext = pathinfo($_FILES['profilePic']['name'], PATHINFO_EXTENSION);
    $newFileName = uniqid("profile_", true) . "." . $ext;
    $targetFile = $uploadDir . $newFileName;

    if (move_uploaded_file($_FILES['profilePic']['tmp_name'], $targetFile)) {
        $profile_pic_filename = $newFileName;
    }
}

$fields = [];
$params = [];
$types  = "";

if ($pers_fname)    { $fields[] = "pers_fname=?";    $params[] = $pers_fname;    $types.="s"; }
if ($pers_lname)    { $fields[] = "pers_lname=?";    $params[] = $pers_lname;    $types.="s"; }
if ($pers_email)    { $fields[] = "pers_email=?";    $params[] = $pers_email;    $types.="s"; }
if ($pers_phone)    { $fields[] = "pers_phone=?";    $params[] = $pers_phone;    $types.="s"; }
if ($pers_password) { 
    $hashed = password_hash($pers_password, PASSWORD_DEFAULT);
    $fields[] = "pers_password=?"; 
    $params[] = $hashed;
    $types .= "s"; 
}

if ($pers_age)      { $fields[] = "pers_age=?";      $params[] = $pers_age;      $types.="i"; }
if ($pers_gender)   { $fields[] = "pers_gender=?";   $params[] = $pers_gender;   $types.="s"; }
if ($pers_birth)    { $fields[] = "pers_birth=?";    $params[] = $pers_birth;    $types.="s"; }
if ($profile_pic_filename) { 
    $fields[] = "pers_profile_pic=?"; 
    $params[] = $profile_pic_filename; 
    $types.="s"; 
}

if (empty($fields)) {
    echo json_encode(["success"=>false, "message"=>"Nothing to update"]);
    exit;
}

$sql = "UPDATE DeliveryPersonnel SET " . implode(", ", $fields) . " WHERE pers_username=?";
$params[] = $pers_username;
$types .= "s";

$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);

if ($stmt->execute()) {
    echo json_encode(["success"=>true, "message"=>"Profile updated successfully"]);
} else {
    echo json_encode(["success"=>false, "message"=>"Update failed"]);
}

$stmt->close();
$conn->close();
?>
