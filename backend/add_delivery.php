<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

include 'database.php';
mysqli_query($conn, "SET time_zone = '+08:00'");
date_default_timezone_set('Asia/Manila');


function generateTrackingNumber($length = 10) {
    $prefix = "ENV"; 
    $characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $randomPart = '';
    $remainingLength = $length - strlen($prefix);
    for ($i = 0; $i < $remainingLength; $i++) {
        $randomPart .= $characters[random_int(0, strlen($characters) - 1)];
    }
    return $prefix . $randomPart;
}

function getCoordinatesFromAddress($address) {
    if (empty($address)) return [null, null];

    $encodedAddress = urlencode($address);
    $url = "https://nominatim.openstreetmap.org/search?format=json&q={$encodedAddress}";

    $opts = [
        "http" => [
            "header" => "User-Agent: DeliverySystem/1.0\r\n"
        ]
    ];
    $context = stream_context_create($opts);
    $response = @file_get_contents($url, false, $context);

    if ($response === FALSE) return [null, null];

    $data = json_decode($response, true);

    if (!empty($data) && isset($data[0]['lat']) && isset($data[0]['lon'])) {
        return [floatval($data[0]['lat']), floatval($data[0]['lon'])];
    }

    return [null, null];
}

try {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data) throw new Exception("No input data");

    $customer_name        = $data['customer_name'] ?? '';
    $customer_address     = $data['customer_address'] ?? '';
    $customer_city        = $data['city'] ?? '';        
    $customer_barangay    = $data['barangay'] ?? '';  
    $customer_contact     = $data['customer_contact'] ?? '';
    $date_of_order        = $data['date_of_order'] ?? null;
    $target_date_delivery = $data['target_date_delivery'] ?? null;
    $mode_of_payment      = $data['payment_method'] ?? '';
    $payment_option       = $data['payment_option'] ?? '';

    $full_payment   = !empty($data['full_payment']) ? floatval($data['full_payment']) : 0;
    $fbilling_date  = !empty($data['fp_collection_date']) ? $data['fp_collection_date'] : null;
    $down_payment   = !empty($data['down_payment']) ? floatval($data['down_payment']) : 0;
    $dbilling_date  = !empty($data['dp_collection_date']) ? $data['dp_collection_date'] : null;
    $balance        = !empty($data['balance']) ? floatval($data['balance']) : 0;
    $total          = !empty($data['total']) ? floatval($data['total']) : 0;
    $order_items    = $data['order_items'] ?? [];

    list($latitude, $longitude) = getCoordinatesFromAddress($customer_address . ', Laguna, Philippines');

    if ($latitude === null || $longitude === null) {
        $simpleAddress = trim("$customer_barangay, $customer_city, Laguna, Philippines");
        list($latitude, $longitude) = getCoordinatesFromAddress($simpleAddress);
    }

    if ($latitude === null || $longitude === null) {
       
        $latitude = 14.1640;
        $longitude = 121.4360;
    }

    $tracking_number = generateTrackingNumber();


    $stmt = $conn->prepare("INSERT INTO Transactions
        (tracking_number, customer_name, customer_address, customer_contact, date_of_order, target_date_delivery,
         mode_of_payment, payment_option, full_payment, fbilling_date, down_payment, dbilling_date, balance, total, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    if (!$stmt) throw new Exception($conn->error);

    $stmt->bind_param(
        "ssssssssdsdsdddd",
        $tracking_number,
        $customer_name,
        $customer_address,
        $customer_contact,
        $date_of_order,
        $target_date_delivery,
        $mode_of_payment,
        $payment_option,
        $full_payment,
        $fbilling_date,
        $down_payment,
        $dbilling_date,
        $balance,
        $total,
        $latitude,
        $longitude
    );

    if (!$stmt->execute()) throw new Exception($stmt->error);
    $transaction_id = $conn->insert_id;
    $stmt->close();

    
    if (!empty($order_items)) {
        $stmt_product_check = $conn->prepare("
            SELECT product_id 
            FROM Product 
            WHERE TRIM(LOWER(type_of_product)) = TRIM(LOWER(?)) 
              AND TRIM(LOWER(description)) = TRIM(LOWER(?))
        ");
        $stmt_po = $conn->prepare("INSERT INTO PurchaseOrder 
            (transaction_id, product_id, type_of_product, description, quantity, unit_cost)
            VALUES (?, ?, ?, ?, ?, ?)");

        foreach ($order_items as $item) {
            $type_of_product = trim($item['type_of_product'] ?? '');
            $description     = trim($item['description'] ?? '');
            $unit_cost       = isset($item['unit_cost']) ? floatval($item['unit_cost']) : 0;
            $quantity        = isset($item['quantity']) ? intval($item['quantity']) : 0;

            if (empty($type_of_product) || empty($description)) {
                throw new Exception("Product type and description cannot be empty");
            }

            $stmt_product_check->bind_param("ss", $type_of_product, $description);
            $stmt_product_check->execute();
            $stmt_product_check->store_result();
            $stmt_product_check->bind_result($product_id);

            if ($stmt_product_check->num_rows > 0) {
                $stmt_product_check->fetch();
            } else {
                throw new Exception("Invalid product: $type_of_product - $description not found in Product table");
            }

            $stmt_po->bind_param(
                "iissid",
                $transaction_id,
                $product_id,
                $type_of_product,
                $description,
                $quantity,
                $unit_cost
            );
            if (!$stmt_po->execute()) {
                throw new Exception("PurchaseOrder insert failed: " . $stmt_po->error);
            }
        }

        $stmt_product_check->close();
        $stmt_po->close();
    }

    echo json_encode([
        "status" => "success",
        "transaction_id" => $transaction_id,
        "tracking_number" => $tracking_number,
        "latitude" => $latitude,
        "longitude" => $longitude
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}

$conn->close();
?>
