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
header("Content-Type: application/json; charset=utf-8");

include 'database.php';

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);

$transactionId = isset($data['transaction_id']) ? intval($data['transaction_id']) : 0;

if ($transactionId <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid transaction ID"]);
    exit;
}

try {
    $conn->begin_transaction();

    $sql1 = "UPDATE Transactions SET status = 'Out for Delivery', shipout_at = NOW() WHERE transaction_id = ?";
    $stmt1 = $conn->prepare($sql1);
    $stmt1->bind_param("i", $transactionId);
    $stmt1->execute();

    if ($stmt1->affected_rows <= 0) {
        $check = $conn->prepare("SELECT transaction_id FROM Transactions WHERE transaction_id = ?");
        $check->bind_param("i", $transactionId);
        $check->execute();
        $resCheck = $check->get_result();
        if ($resCheck->num_rows === 0) {
            throw new Exception("Transaction not found or not updated.");
        }
    }

    $sql2 = "UPDATE DeliveryDetails SET delivery_status = 'Out for Delivery', updated_at = NOW() WHERE transaction_id = ?";
    $stmt2 = $conn->prepare($sql2);
    $stmt2->bind_param("i", $transactionId);
    $stmt2->execute();

    $sql3 = "SELECT customer_name, customer_contact, tracking_number FROM Transactions WHERE transaction_id = ?";
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

    // --- Normalize Phone Number ---
    $c = preg_replace('/[^0-9\+]/', '', $customerContact);
    if (preg_match('/^\+63[0-9]{10}$/', $c)) {
        $phoneNormalized = $c;
    } elseif (preg_match('/^63[0-9]{10}$/', $c)) {
        $phoneNormalized = '+' . $c;
    } elseif (preg_match('/^09[0-9]{9}$/', $c)) {
        $phoneNormalized = '+63' . substr($c, 1);
    } elseif (preg_match('/^[0-9]{10}$/', $c)) {
        $phoneNormalized = '+63' . $c;
    } else {
        throw new Exception("Invalid phone number format: " . $customerContact);
    }

    $conn->commit();

    $trackingUrlSafe = "cessie840 . github . io / Envirocool-Tracking-Page /";
    $message = "Hi {$customerName}!" . PHP_EOL . PHP_EOL .
        "Your order is now Out for Delivery." . PHP_EOL .
        "Tracking No: {$trackingNumber}." . PHP_EOL .
        "Track here: {$trackingUrlSafe}" . PHP_EOL . PHP_EOL .
        "Use your tracking number to check your delivery status on the website." . PHP_EOL . PHP_EOL .
        "This is a system notification from Envirocool Corp. Please do not reply." . PHP_EOL . PHP_EOL .
        "Note: We added spaces in the link to avoid detection by telecom filters." . PHP_EOL . PHP_EOL .
        "-Envirocool Corp.";

    // --- SkyIO SMS API ---
    $apiUrl = "https://sms.skyio.site/api/sms/send";
    $apiKey = "Qyi5vgSUjNiXnezqcfElQ8rafEx31TPJH1kxVdJJVEt4GT6sgqXb7Hyzby1Jx2RH";

    $smsPayload = [
        "to" => $phoneNormalized,
        "message" => $message
    ];

    $ch = curl_init($apiUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer {$apiKey}",
            "Content-Type: application/json",
            "Accept: application/json"
        ],
        CURLOPT_POSTFIELDS => json_encode($smsPayload, JSON_UNESCAPED_UNICODE),
        CURLOPT_TIMEOUT => 30,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    // Log to see exactly what SkyIO returned
    file_put_contents(
        'sms_debug_log.txt',
        "HTTP {$httpCode}\n{$response}\nError: {$curlError}\n\n",
        FILE_APPEND
    );

    $historyReason = $curlError ? "cURL error: {$curlError}" : "HTTP {$httpCode} | Response: {$response}";

    $sqlHistory = "INSERT INTO DeliveryHistory (transaction_id, event_type, reason, event_timestamp)
                   VALUES (?, 'SMS Sent', ?, NOW())";
    $stmtHist = $conn->prepare($sqlHistory);
    $stmtHist->bind_param("is", $transactionId, $historyReason);
    $stmtHist->execute();

    if ($curlError) {
        echo json_encode(["success" => true, "message" => "Transaction updated, but SMS failed.", "sms_error" => $curlError]);
    } elseif ($httpCode !== 200 && $httpCode !== 201) {
        echo json_encode(["success" => true, "message" => "Transaction updated, but SMS API returned HTTP {$httpCode}.", "sms_response" => json_decode($response, true)]);
    } else {
        echo json_encode(["success" => true, "message" => "Transaction updated and SMS sent successfully!", "sms_response" => json_decode($response, true)]);
    }

} catch (Exception $e) {
    if (method_exists($conn, 'rollback'))
        @$conn->rollback();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
} finally {
    if (isset($stmt1))
        $stmt1->close();
    if (isset($stmt2))
        $stmt2->close();
    if (isset($stmt3))
        $stmt3->close();
    if (isset($stmtHist))
        $stmtHist->close();
    $conn->close();
}
?>