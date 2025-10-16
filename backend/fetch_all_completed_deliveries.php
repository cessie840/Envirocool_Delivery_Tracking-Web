<?php
require_once "database.php";

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$sql = "
    SELECT 
        t.transaction_id AS id,
        t.customer_name AS name,
        t.customer_contact AS contact,
        t.customer_address AS address,
        po.type_of_product AS type_of_product,
        po.description AS description,
        t.created_at AS time,
        t.shipout_at AS shipout_time,
        t.completed_at AS completed_time,
        t.tracking_number AS tracking_number,
                 t.latitude,            
         t.longitude,    
        t.assigned_device_id,
        CONCAT(dp.pers_fname, ' ', dp.pers_lname, ' (', dp.pers_username, ')') AS driver,
        t.status AS status
         
    FROM DeliveryAssignments da
    JOIN Transactions t ON da.transaction_id = t.transaction_id
    JOIN PurchaseOrder po ON po.transaction_id = t.transaction_id
    JOIN DeliveryPersonnel dp ON da.personnel_username = dp.pers_username
    WHERE t.status = 'Delivered'
    ORDER BY t.transaction_id DESC
";

$result = $conn->query($sql);

$deliveries = [];
while ($row = $result->fetch_assoc()) {
    $deliveries[] = [
        "transaction_id"    => $row['id'],
        "customer_name"     => $row['name'],
        "contact"           => $row['contact'],
        "customer_address"  => $row['address'],
        "type_of_product"   => $row['type_of_product'],
        "description"       => $row['description'],
        "time"              => $row['created_at'],
        "shipout_time"      => $row['shipout_time'],
        "completed_time"    => $row['completed_time'],
        "tracking_number"   => $row['tracking_number'], 
          "latitude"         => $row['latitude'],  
        "longitude"        => $row['longitude'],  
        "assigned_device_id" => $row['assigned_device_id'], 
        "driver"            => $row['driver'],
        "status"            => $row['status'],
        "distance"          => "N/A",
        "eta"               => "N/A"
    ];
}

echo json_encode($deliveries);
$conn->close();
?>
