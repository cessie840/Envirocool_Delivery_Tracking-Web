<?php
// ✅ Allow specific origins
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");

// ✅ Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ✅ Include your database connection
include 'database.php'; 

/*
-------------------------------------------------------
  QUERY LOGIC:
  - total: All transactions
  - successful: Delivered transactions
  - cancelled: 
        • Either has current status = 'Cancelled'
        • OR has any 'Cancelled' record in DeliveryHistory
    (So previously cancelled but rescheduled transactions 
     are still counted as cancelled.)
  - pending: Pending transactions
-------------------------------------------------------
*/

$sql = "
    SELECT 
        COUNT(DISTINCT t.transaction_id) AS total,
        SUM(
            CASE 
                WHEN COALESCE(dd.delivery_status, t.status) = 'Delivered' 
                THEN 1 ELSE 0 
            END
        ) AS successful,
        SUM(
            CASE 
                WHEN COALESCE(dd.delivery_status, t.status) = 'Cancelled'
                     OR EXISTS (
                        SELECT 1 
                        FROM DeliveryHistory dh 
                        WHERE dh.transaction_id = t.transaction_id 
                        AND dh.event_type = 'Cancelled'
                     )
                THEN 1 
                ELSE 0 
            END
        ) AS cancelled,
        SUM(
            CASE 
                WHEN COALESCE(dd.delivery_status, t.status) = 'Pending' 
                THEN 1 ELSE 0 
            END
        ) AS pending
    FROM Transactions t
    LEFT JOIN DeliveryDetails dd 
        ON t.transaction_id = dd.transaction_id
";

// ✅ Run query
$result = $conn->query($sql);

// ✅ Output result as JSON
if ($result && $row = $result->fetch_assoc()) {
    echo json_encode([
        "success"    => true,
        "total"      => (int)$row['total'],
        "successful" => (int)$row['successful'],
        "cancelled"  => (int)$row['cancelled'],
        "pending"    => (int)$row['pending']
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Query failed or returned no results"
    ]);
}

// ✅ Close connection
$conn->close();
?>
