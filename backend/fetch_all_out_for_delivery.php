<?php
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: http://localhost:5173");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    http_response_code(200);
    exit();
}

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST");
header("Content-Type: application/json");

include 'database.php';
if (!$conn) {
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit;
}

$sql = "
SELECT 
    t.transaction_id,
    t.customer_name,
    t.customer_address,
    t.customer_contact,
    po.type_of_product AS type_of_product,
    po.description AS description,
    t.created_at,
    t.shipout_at,
    t.tracking_number,
    t.status,
    t.assigned_device_id,
    t.latitude,              
    t.longitude,     
    CONCAT(dp.pers_fname, ' ', dp.pers_lname, ' (', dp.pers_username, ')') AS driver
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
    "transaction_id"   => $row['transaction_id'],
    "customer_name"    => $row['customer_name'],
    "contact"          => $row['customer_contact'],
    "customer_address" => $row['customer_address'],
    "type_of_product" => $row['type_of_product'],
    "description"    => $row['description'],
    "time"             => $row['created_at'],
    "shipout_time"     => $row['shipout_at'],
    "driver"           => $row['driver'],
    "status"           => $row['status'],
    "tracking_number"  => $row['tracking_number'],
    "latitude"         => $row['latitude'],  
    "longitude"        => $row['longitude'],  
    "assigned_device_id" => $row['assigned_device_id'], 
];

}

echo json_encode(["success" => true, "deliveries" => $deliveries]);
$conn->close();
?>
