<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

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

$data = json_decode(file_get_contents("php://input"), true);
$transactionId = isset($data['transaction_id']) ? intval($data['transaction_id']) : 0;

if ($transactionId <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid transaction ID"]);
    exit;
}

$conn->begin_transaction();

try {
    // Update transaction status
    $sql1 = "UPDATE Transactions 
             SET status = 'Out for Delivery', shipout_at = NOW() 
             WHERE transaction_id = ?";
    $stmt1 = $conn->prepare($sql1);
    $stmt1->bind_param("i", $transactionId);
    $stmt1->execute();

    if ($stmt1->affected_rows <= 0) {
        throw new Exception("Failed to update transaction status.");
    }

    // Update delivery details
    $sql2 = "UPDATE DeliveryDetails 
             SET delivery_status = 'Out for Delivery' 
             WHERE transaction_id = ?";
    $stmt2 = $conn->prepare($sql2);
    $stmt2->bind_param("i", $transactionId);
    $stmt2->execute();

    // Fetch customer info
    $sql3 = "SELECT customer_name, customer_contact, tracking_number 
             FROM Transactions WHERE transaction_id = ?";
    $stmt3 = $conn->prepare($sql3);
    $stmt3->bind_param("i", $transactionId);
    $stmt3->execute();
    $result = $stmt3->get_result();

    if ($result->num_rows === 0) {
        throw new Exception("Customer not found for this transaction.");
    }

    $row = $result->fetch_assoc();
    $customerName = $row['customer_name'];
    $customerContact = $row['customer_contact'];
    $trackingNumber = $row['tracking_number'];

    // Validate phone number
    if (!preg_match('/^0[9][0-9]{9}$/', $customerContact)) {
        throw new Exception("Invalid phone number format: $customerContact");
    }
    $phone = "+63" . ltrim($customerContact, '0');

    // SkyIO SMS API
    $apiUrl = "https://sms.skyio.site/api/sms/send";
    $apiKey = "Qyi5vgSUjNiXnezqcfElQ8rafEx31TPJH1kxVdJJVEt4GT6sgqXb7Hyzby1Jx2RH";
    $message = "Hi $customerName!\n\nYour order is now Out for Delivery.\nTracking No: $trackingNumber.\nTrack here: cessie840 . github . io / Envirocool-Tracking-Page/\n\nUse your tracking number to check your delivery status on the website.\n\nThis is a system notification from Envirocool Corp. Please do not reply.\n\nNote:\nWe added a space in every dot to avoid detection by telecom filters. Please remove the spaces when typing in your browser.\n\n-Envirocool Corp.";



$smsData = [
  "to" => $phone,
  "message" => $message
];

    // cURL setup
    $ch = curl_init($apiUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer $apiKey",
            "Content-Type: application/json"
        ],
        CURLOPT_POSTFIELDS => json_encode($smsData),
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_VERBOSE => true
    ]);

    ob_start();
    $response = curl_exec($ch);
    $curlDebug = ob_get_clean();
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    $debugInfo = [
        "curl_error" => $curlError,
        "http_code" => $httpCode,
        "curl_debug" => $curlDebug,
        "sent_payload" => $smsData,
        "api_response_raw" => $response
    ];

    // Log debug info
    file_put_contents('sms_debug.log', print_r($debugInfo, true) . "\n", FILE_APPEND);

    if ($curlError) {
        throw new Exception("SMS Error: " . $curlError);
    }

    if ($httpCode !== 200 && $httpCode !== 201) {
        throw new Exception("SMS API Error (HTTP $httpCode): " . $response);
    }

    $decodedResponse = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Failed to parse SMS API response: " . json_last_error_msg());
    }
    if (isset($decodedResponse['status']) && $decodedResponse['status'] === 'error') {
        throw new Exception("SMS API Error: " . ($decodedResponse['message'] ?? 'Unknown error'));
    }

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Transaction updated and SMS sent successfully!",
        "sms_response" => $decodedResponse,
        "debug_info" => $debugInfo
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage(),
        "debug_info" => isset($debugInfo) ? $debugInfo : null
    ], JSON_PRETTY_PRINT);
}

$conn->close();
?>