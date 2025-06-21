<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include 'database.php'; // should define $conn as mysqli

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->pers_username)) {
    echo json_encode(["error" => "Missing username"]);
    exit;
}

$username = $data->pers_username;

try {
    $stmt = $conn->prepare("SELECT pers_username, pers_fname, pers_lname, pers_email, pers_phone, pers_profile_pic FROM DeliveryPersonnel WHERE pers_username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();

    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        $stmt->bind_result($pers_username, $pers_fname, $pers_lname, $pers_email, $pers_phone, $pers_profile_pic);
        $stmt->fetch();

        // Make sure profile picture URL is complete
        $base_url = "http://localhost/DeliveryTrackingSystem/uploads/";
        $profile_pic_url = $pers_profile_pic ? $base_url . $pers_profile_pic : $base_url . "default-profile-pic.png";

        $user = [
            "pers_username" => $pers_username,
            "pers_fname" => $pers_fname,
            "pers_lname" => $pers_lname,
            "pers_email" => $pers_email,
            "pers_phone" => $pers_phone,
            "pers_profile_pic" => $profile_pic_url
        ];

        echo json_encode(["success" => true, "user" => $user]);
    } else {
        echo json_encode(["success" => false, "message" => "No delivery personnel found"]);
    }

    $stmt->close();
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
