<?php
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: http://localhost:5173");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    http_response_code(200);
    exit();
}

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

include 'database.php';

if (!$conn) {
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit;
}

$sql = "
 SELECT 
        t.transaction_id AS id,
        t.customer_name AS name,
        t.customer_contact AS contact,
        t.customer_address AS address,
        po.description AS description,
        t.created_at AS time,
        t.shipout_at as shipout_time,
        t.tracking_number AS tracking_number,
        CONCAT(dp.pers_fname, ' ', dp.pers_lname, ' (', dp.pers_username, ')') AS driver,
        t.status AS status
    FROM DeliveryAssignments da
    JOIN Transactions t ON da.transaction_id = t.transaction_id
    JOIN PurchaseOrder po ON po.transaction_id = t.transaction_id
    JOIN DeliveryPersonnel dp ON da.personnel_username = dp.pers_username
    WHERE t.status = 'Out for Delivery'
    ORDER BY t.transaction_id DESC";

$result = $conn->query($sql);

$deliveries = [];
while ($row = $result->fetch_assoc()) {
    $deliveries[] = [
      "transaction_id" => $row['id'],
    "customer_name"  => $row['name'],
    "contact"        => $row['contact'],
    "customer_address" => $row['address'],
    "description"    => $row['description'],
    "time"           => $row['time'],
    "shipout_time"           => $row['shipout_time'],
    "driver"         => $row['driver'],
    "status"         => $row['status'],
    "tracking_number"           => $row['tracking_number'],
    "distance"       => "N/A",
    "eta"            => "N/A"
    ];
}

echo json_encode($deliveries);
$conn->close();
?>
