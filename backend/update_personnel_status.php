<?php
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include "database.php";

$data = json_decode(file_get_contents("php://input"), true);

$username = $data['username'] ?? '';
$status   = $data['status'] ?? '';

if ($username && $status) {
    $assignment_status = null;

    // 🔹 Always check if this personnel has a transaction today that is "Out for Delivery"
    $sql = "
        SELECT da.assignment_id
        FROM DeliveryAssignments da
        INNER JOIN Transactions t ON da.transaction_id = t.transaction_id
        WHERE da.personnel_username = ?
          AND t.status = 'Out for Delivery'
          AND DATE(t.target_date_delivery) = CURDATE()
        LIMIT 1
    ";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result && $result->num_rows > 0) {
        // ✅ Force "Out for Delivery" if transaction exists
        $assignment_status = "Out for Delivery";
    } else {
        // Otherwise, follow status logic
        if ($status === "Active") {
            $assignment_status = "Available";
        } else {
            $assignment_status = "Inactive";
        }
    }
    $stmt->close();

    // ✅ Update delivery personnel table
    $stmt = $conn->prepare("
        UPDATE DeliveryPersonnel 
        SET status = ?, assignment_status = ? 
        WHERE pers_username = ?
    ");
    $stmt->bind_param("sss", $status, $assignment_status, $username);

    if ($stmt->execute()) {
        echo json_encode([
            "success" => true,
            "message" => "Status updated",
            "assignment_status" => $assignment_status
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Database update failed"]);
    }
    $stmt->close();
} else {
    echo json_encode(["success" => false, "message" => "Invalid input"]);
}

$conn->close();
