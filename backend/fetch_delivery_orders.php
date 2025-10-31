<?php
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

include 'database.php';

$orders = [];

$sql = "
SELECT 
    t.*, 
    dp.pers_username, 
    dp.pers_profile_pic,
    da.device_id,
    CONCAT(dp.pers_fname, ' ', dp.pers_lname) AS assigned_personnel,
    g.lat AS latest_lat,
    g.lng AS latest_lng,
    g.recorded_at AS last_gps_time
FROM Transactions t
LEFT JOIN DeliveryAssignments da 
    ON t.transaction_id = da.transaction_id
LEFT JOIN DeliveryPersonnel dp 
    ON da.personnel_username = dp.pers_username
LEFT JOIN gps_coordinates g 
    ON g.id = (
        SELECT MAX(id) 
        FROM gps_coordinates 
        WHERE gps_coordinates.device_id = da.device_id
    )
WHERE t.balance = 0
ORDER BY t.transaction_id DESC
";

$result = $conn->query($sql);

$profilePicDir = __DIR__ . "/uploads/personnel_profile_pic/";
$baseUrl = "http://localhost/DeliveryTrackingSystem/uploads/personnel_profile_pic/";

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $transactionId = (int) $row['transaction_id'];

        $itemsSql = "
            SELECT 
                type_of_product AS product_name,
                description,
                quantity,
                unit_cost,
                total_cost
            FROM PurchaseOrder
            WHERE transaction_id = $transactionId
        ";
        $itemsResult = $conn->query($itemsSql);

        $items = [];
        $calculatedTotal = 0;

        if ($itemsResult && $itemsResult->num_rows > 0) {
            while ($item = $itemsResult->fetch_assoc()) {
                $itemTotal = floatval($item['total_cost']);
                $calculatedTotal += $itemTotal;

                $items[] = [
                    'name' => trim(($item['product_name'] ?? '') . ' ' . ($item['description'] ?? '')),
                    'quantity' => intval($item['quantity']),
                    'unit_cost' => floatval($item['unit_cost']),
                    'total_cost' => floatval($itemTotal)
                ];
            }
        }

        $profilePic = trim($row['pers_profile_pic']);
        $defaultPic = "http://localhost/DeliveryTrackingSystem/uploads/default-profile-pic.png";

        if (!empty($profilePic)) {
            $picFilename = basename($profilePic);
            $fullPath = $profilePicDir . $picFilename;

            if (file_exists($fullPath)) {
                $profilePic = $baseUrl . $picFilename;
            } else {
                $profilePic = $defaultPic;
            }
        } else {
            $profilePic = $defaultPic;
        }

        $orders[] = [
            'transaction_id' => $transactionId,
            'customer_name' => $row['customer_name'],
            'customer_address' => $row['customer_address'],
            'contact_number' => $row['customer_contact'],
            'payment_mode' => $row['mode_of_payment'],
            'down_payment' => floatval($row['down_payment']),
            'balance' => floatval($row['balance']),
            'total_cost' => floatval($calculatedTotal),
            'assigned_personnel' => $row['assigned_personnel'] ?? null,
            'assigned_personnel_username' => $row['pers_username'] ?? null,
            'personnel_image' => $profilePic,
            'device_id' => $row['device_id'] ?? null,
            'latest_lat' => $row['latest_lat'] ?? null,
            'latest_lng' => $row['latest_lng'] ?? null,
            'last_gps_time' => $row['last_gps_time'] ?? null,
            'status' => $row['status'],
            'items' => $items,
            'tracking_number' => $row['tracking_number'],
            'target_date_delivery' => $row['target_date_delivery'],
            'rescheduled_date' => $row['rescheduled_date'],
        ];
    }
}

echo json_encode($orders);
$conn->close();
?>
