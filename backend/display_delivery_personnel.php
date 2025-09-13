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

// ✅ 1. Sync assignment_status = 'Out for Delivery' if personnel has active deliveries
$syncOutForDelivery = "
    UPDATE DeliveryPersonnel dp
    INNER JOIN DeliveryAssignments da ON dp.pers_username = da.personnel_username
    INNER JOIN Transactions t ON da.transaction_id = t.transaction_id
    SET dp.assignment_status = 'Out for Delivery'
    WHERE t.status = 'Out for Delivery'
";
$conn->query($syncOutForDelivery);

// ✅ 2. Sync assignment_status back to 'Available' if their transactions are finished (Delivered)
$syncAvailable = "
    UPDATE DeliveryPersonnel dp
    SET dp.assignment_status = 'Available'
    WHERE dp.status = 'Active'
      AND dp.assignment_status = 'Out for Delivery'
      AND NOT EXISTS (
          SELECT 1
          FROM DeliveryAssignments da
          INNER JOIN Transactions t ON da.transaction_id = t.transaction_id
          WHERE da.personnel_username = dp.pers_username
            AND t.status = 'Out for Delivery'
      )
";
$conn->query($syncAvailable);

// ✅ 3. Handle soft delete (set status = Inactive, assignment_status = NULL)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->username) || empty($data->username)) {
        echo json_encode(["status" => "error", "message" => "Username is required."]);
        exit;
    }

    $username = $conn->real_escape_string($data->username);

    $updateSql = "
        UPDATE DeliveryPersonnel 
        SET status = 'Inactive', assignment_status = NULL
        WHERE pers_username = '$username'
    ";
    if ($conn->query($updateSql) === TRUE) {
        echo json_encode(["status" => "success", "message" => "Personnel hidden (soft deleted)."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to hide personnel."]);
    }
    exit; 
}

// ✅ 4. Display accounts with updated assignment_status
$sql = "
    SELECT pers_username, pers_fname, pers_lname, pers_email, status, assignment_status
    FROM DeliveryPersonnel
";

$result = $conn->query($sql);

$personnel = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $personnel[] = $row;
    }
}

echo json_encode($personnel);

$conn->close();
?>
