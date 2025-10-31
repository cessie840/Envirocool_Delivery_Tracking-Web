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
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'database.php'; 

$year = isset($_GET['year']) ? (int)$_GET['year'] : date("Y");

$successful = 0;
$cancelled = 0;
$total = 0;

$sql_success = "
    SELECT COUNT(DISTINCT t.transaction_id) AS total
    FROM Transactions t
    LEFT JOIN DeliveryDetails dd 
        ON t.transaction_id = dd.transaction_id
    WHERE COALESCE(dd.delivery_status, t.status) = 'Delivered'
      AND YEAR(
          CASE 
              WHEN t.date_of_order IS NOT NULL THEN t.date_of_order
              WHEN t.created_at IS NOT NULL THEN t.created_at
              ELSE NOW()
          END
      ) = ?
";
$stmt = $conn->prepare($sql_success);
$stmt->bind_param("i", $year);
$stmt->execute();
$result = $stmt->get_result()->fetch_assoc();
$successful = (int)($result['total'] ?? 0);
$stmt->close();

$sql_cancelled = "
    SELECT COUNT(DISTINCT t.transaction_id) AS total
    FROM Transactions t
    LEFT JOIN DeliveryDetails dd 
        ON t.transaction_id = dd.transaction_id
    WHERE YEAR(
              CASE 
                  WHEN t.date_of_order IS NOT NULL THEN t.date_of_order
                  WHEN t.created_at IS NOT NULL THEN t.created_at
                  ELSE NOW()
              END
          ) = ?
      AND (
          COALESCE(dd.delivery_status, t.status) = 'Cancelled'
          OR EXISTS (
              SELECT 1 
              FROM DeliveryHistory dh 
              WHERE dh.transaction_id = t.transaction_id
              AND dh.event_type = 'Cancelled'
          )
      )
";
$stmt = $conn->prepare($sql_cancelled);
$stmt->bind_param("i", $year);
$stmt->execute();
$result = $stmt->get_result()->fetch_assoc();
$cancelled = (int)($result['total'] ?? 0);
$stmt->close();

$total = $successful + $cancelled;

echo json_encode([
    "success" => true,
    "year" => $year,
    "total" => $total,
    "distribution" => [
        ["name" => "Successful", "value" => $successful],
        ["name" => "Cancelled", "value" => $cancelled]
    ]
]);

$conn->close();
?>
