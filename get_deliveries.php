<?php
// === CORS HEADERS FOR REACT FRONTEND ===
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// === Include Database Connection ===
include 'database.php';

try {
    $sql = "
        SELECT 
            d.transaction_id,
            t.customer_name,
            po.description,
            po.quantity,
            t.total,
            d.delivery_status
        FROM DeliveryDetails d
        INNER JOIN Transactions t ON d.transaction_id = t.transaction_id
        INNER JOIN PurchaseOrder po ON d.po_id = po.po_id
        ORDER BY d.updated DESC
    ";

    $result = $conn->query($sql);

    $deliveries = [];

    while ($row = $result->fetch_assoc()) {
        $deliveries[] = $row;
    }

    echo json_encode($deliveries);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Server error", "details" => $e->getMessage()]);
}

$conn->close();
