<?php
include 'database.php'; 
date_default_timezone_set("Asia/Manila");

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    if (empty($_POST['transaction_id']) || empty($_FILES['proof_of_delivery'])) {
        echo json_encode(["success" => false, "message" => "Transaction ID and proof file required."]);
        exit;
    }

    $transaction_id = intval($_POST['transaction_id']);

    // ✅ Save file to the correct directory
    $targetDir = __DIR__ . "/uploads/proof_of_delivery/";
    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0777, true);
    }

    // ✅ Determine file extension (default jpg)
    $fileExt = pathinfo($_FILES["proof_of_delivery"]["name"], PATHINFO_EXTENSION);
    if (empty($fileExt)) $fileExt = "jpg";

    // ✅ File name format: TN_[TRANSACTION NUMBER]_[YYYYMMDD].jpg
    $dateToday = date("Ymd");
    $fileName = "TN_" . $transaction_id . "_" . $dateToday . "." . $fileExt;

    $targetFile = $targetDir . $fileName;

    if (move_uploaded_file($_FILES["proof_of_delivery"]["tmp_name"], $targetFile)) {

        // ✅ Store correct relative path
        $relativePath = "uploads/proof_of_delivery/" . $fileName;

        $stmt = $conn->prepare("
            UPDATE Transactions 
            SET status = 'Delivered', proof_of_delivery = ?, completed_at = NOW() 
            WHERE transaction_id = ?
        ");
        $stmt->bind_param("si", $relativePath, $transaction_id);

        if ($stmt->execute()) {
            echo json_encode([
                "success" => true,
                "message" => "Proof uploaded successfully.",
                "file" => $relativePath
            ]);
        } else {
            echo json_encode(["success" => false, "message" => "Database update failed."]);
        }
        $stmt->close();
    } else {
        echo json_encode(["success" => false, "message" => "File upload failed."]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
}
?>
