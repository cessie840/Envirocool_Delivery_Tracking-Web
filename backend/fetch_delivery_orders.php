<?php
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

header("Content-Type: application/json");
include 'database.php';

$orders = [];

$sql = "
   SELECT 
    t.*,
    da.personnel_username,
    dp.pers_profile_pic,
    CONCAT(dp.pers_fname, ' ', dp.pers_lname) AS assigned_personnel
FROM Transactions t
LEFT JOIN DeliveryAssignments da 
    ON t.transaction_id = da.transaction_id
LEFT JOIN DeliveryPersonnel dp 
    ON da.personnel_username = dp.pers_username
ORDER BY t.transaction_id DESC
";

$result = $conn->query($sql);

$baseURL = "http://localhost/DeliveryTrackingSystem/uploads/";

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $transactionId = (int) $row['transaction_id'];

        // 🟢 Updated query: include product/type name
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

                // 🟢 Combine product name + description
                $items[] = [
                    'name' => trim(($item['product_name'] ?? '') . ' ' . ($item['description'] ?? '')),
                    'quantity' => intval($item['quantity']),
                    'unit_cost' => floatval($item['unit_cost']),
                    'total_cost' => floatval($itemTotal)
                ];
            }
        }

        // Handle personnel image
        $profilePic = $row['pers_profile_pic'];
        if (!empty($profilePic)) {
            $profilePic = ltrim($profilePic, '/');
            $profilePic = str_replace("uploads/", "", $profilePic);
            $profilePic = $baseURL . $profilePic;
        } else {
            $profilePic = $baseURL . "default-profile-pic.png";
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
            'assigned_personnel' => $row['personnel_username'] ? $row['assigned_personnel'] : null,
            'assigned_personnel_username' => $row['personnel_username'] ?? null,
            'personnel_image' => $profilePic,
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
