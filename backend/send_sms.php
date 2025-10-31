<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$url = "https://sms.skyio.site/api/sms/send";
$apiKey = "Qyi5vgSUjNiXnezqcfElQ8rafEx31TPJH1kxVdJJVEt4GT6sgqXb7Hyzby1Jx2RH";

// SMS details
$data = [
    "to" => "+639486201591",
    "message" => "Hello! This is a test SMS from Liezel using SkyIO API."
];

$ch = curl_init($url);

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer $apiKey",
        "Content-Type: application/json"
    ],
    CURLOPT_POSTFIELDS => json_encode($data),
    CURLOPT_CONNECTTIMEOUT => 10, 
    CURLOPT_TIMEOUT => 30,       
    CURLOPT_SSL_VERIFYPEER => false 
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

curl_close($ch);

if ($error) {
    echo "⚠️ cURL Error: $error\n";
} else {
    echo "✅ HTTP Status Code: $httpCode\n";
    $decoded = json_decode($response, true);

    if (json_last_error() === JSON_ERROR_NONE) {
        echo "📩 API Response:\n";
        print_r($decoded);
    } else {
        echo "Raw Response:\n$response\n";
    }
}
?>
