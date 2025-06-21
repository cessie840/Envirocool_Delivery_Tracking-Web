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

    // Store result to use num_rows
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        // Bind result
        $stmt->bind_result($pers_username, $pers_fname, $pers_lname, $pers_email, $pers_phone, $pers_profile_pic);
        $stmt->fetch();

        $user = [
            "pers_username" => $pers_username,
            "pers_fname" => $pers_fname,
            "pers_lname" => $pers_lname,
            "pers_email" => $pers_email,
            "pers_phone" => $pers_phone,
            "pers_profile_pic" => $pers_profile_pic
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
