<?php
// 🚫 No blank lines before this line!

// ✅ Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: http://localhost:5173");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    http_response_code(200);
    exit();
}

// ✅ Headers
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST");
header("Content-Type: application/json");

// ✅ Include DB connection
include 'database.php';
if (!$conn) {
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit;
}

// ✅ Fetch all "Pending" or "Out for Delivery" transactions with assignments
$sql = "
SELECT 
    t.transaction_id,
    t.customer_name,
    t.customer_address,
    t.customer_contact,
    t.date_of_order,
    t.shipout_at,
    t.tracking_number,
    t.status,
    t.assigned_device_id,
       t.latitude,              -- ✅ add this
    t.longitude,     
    dp.pers_username AS driver,
    po.description
FROM Transactions t
LEFT JOIN DeliveryAssignments da ON t.transaction_id = da.transaction_id
LEFT JOIN DeliveryPersonnel dp ON da.personnel_username = dp.pers_username
LEFT JOIN PurchaseOrder po ON po.transaction_id = t.transaction_id
WHERE t.status IN ('Pending', 'Out for Delivery')
ORDER BY t.transaction_id DESC;
";

$result = $conn->query($sql);

$deliveries = [];
while ($row = $result->fetch_assoc()) {
$deliveries[] = [
    "transaction_id"   => $row['transaction_id'],
    "customer_name"    => $row['customer_name'],
    "contact"          => $row['customer_contact'],
    "customer_address" => $row['customer_address'],
    "description"      => $row['description'],
    "time"             => $row['date_of_order'],
    "shipout_time"     => $row['shipout_at'],
    "driver"           => $row['driver'],
    "status"           => $row['status'],
    "tracking_number"  => $row['tracking_number'],
     "latitude"         => $row['latitude'],  
        "longitude"        => $row['longitude'],  
    "assigned_device_id" => $row['assigned_device_id'], 
    "distance"         => "N/A",
    "eta"              => "N/A"
];

}

echo json_encode(["success" => true, "deliveries" => $deliveries]);
$conn->close();
?>
