<?php
header("Access-Control-Allow-Origin: http://localhost:5173"); 
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once "database.php"; 

if ($_SERVER['REQUEST_METHOD'] === "OPTIONS") {
    http_response_code(200);
    exit;
}

$query = "
   SELECT 
        t.transaction_id,
        t.customer_name,
        t.customer_contact AS contact,
        t.customer_address,
        po.type_of_product AS type_of_product,
        po.description,
        t.date_of_order AS time,
        t.completed_at AS completed_time,
        t.shipout_at AS shipout_time,
        t.cancelled_reason,
        t.cancelled_at AS cancelled_time,
           t.tracking_number AS tracking_number,
        CONCAT(dp.pers_fname, ' ', dp.pers_lname, ' (', dp.pers_username, ')') AS driver,
        t.status
    FROM Transactions t
    LEFT JOIN PurchaseOrder po ON po.transaction_id = t.transaction_id
    LEFT JOIN DeliveryAssignments da ON da.transaction_id = t.transaction_id
    LEFT JOIN DeliveryPersonnel dp ON da.personnel_username = dp.pers_username
    WHERE t.status = 'Cancelled'
    ORDER BY t.transaction_id DESC
";

$result = $conn->query($query);

if ($result && $result->num_rows > 0) {
    $deliveries = [];
    while ($row = $result->fetch_assoc()) {
        $deliveries[] = [
            "transaction_id"   => $row['transaction_id'],
            "customer_name"    => $row['customer_name'],
            "contact"          => $row['contact'],
            "customer_address" => $row['customer_address'],
            "type_of_product" => $row['type_of_product'],
            "description"      => $row['description'],
            "time"             => $row['time'],
            "completed_time"   => $row['completed_time'],
            "shipout_time"           => $row['shipout_time'],
            "cancelled_reason" => $row['cancelled_reason'],
            "cancelled_time"   => $row['cancelled_time'],
            "driver"           => $row['driver'] ?: "N/A",
              "tracking_number"           => $row['tracking_number'],
  
            "status"           => $row['status'],
            "distance"         => "N/A",
            "eta"              => "N/A"
        ];
    }

    echo json_encode([
        "success" => true,
        "deliveries" => $deliveries
    ]);
} else {
    echo json_encode([
        "success" => false,
        "deliveries" => [],
        "message" => "No cancelled deliveries found."
    ]);
}

$conn->close();
?>
