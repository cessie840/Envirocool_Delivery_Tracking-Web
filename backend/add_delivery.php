<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// CORS handling
$allowed_origins = [
    "https://cessie840.github.io",
    "http://localhost:5173",
    "http://localhost:5173/Envirocool-Tracking-Page"
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
} else {
    header("Access-Control-Allow-Origin: http://localhost:5173"); // fallback
}

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}


include 'database.php';

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
        "http" => ["header" => "User-Agent: DeliverySystem/1.0\r\n"]
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
    $customer_name        = $_POST['customer_name'] ?? '';
    $customer_address     = $_POST['customer_address'] ?? '';
    $customer_city        = $_POST['city'] ?? '';
    $customer_barangay    = $_POST['barangay'] ?? '';
    $customer_contact     = $_POST['customer_contact'] ?? '';
    $date_of_order        = $_POST['date_of_order'] ?? null;
    $target_date_delivery = $_POST['target_date_delivery'] ?? null;
    $mode_of_payment      = $_POST['payment_method'] ?? '';
    $payment_option       = $_POST['payment_option'] ?? '';
    $full_payment         = isset($_POST['full_payment']) ? floatval($_POST['full_payment']) : 0;
    $fbilling_date        = $_POST['fp_collection_date'] ?? null;
    $down_payment         = isset($_POST['down_payment']) ? floatval($_POST['down_payment']) : 0;
    $dbilling_date        = $_POST['dp_collection_date'] ?? null;
    $balance              = isset($_POST['balance']) ? floatval($_POST['balance']) : 0;
    $total                = isset($_POST['total']) ? floatval($_POST['total']) : 0;
    $order_items_json     = $_POST['order_items'] ?? '[]';
    $order_items          = json_decode($order_items_json, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Invalid order_items JSON");
    }

    $proof_path = null;
    if (!empty($_FILES['proofOfPayment']['name'])) {
        $uploadDir = __DIR__ . '/proof_of_payment/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $fileTmpPath = $_FILES['proofOfPayment']['tmp_name'];
        $originalName = $_FILES['proofOfPayment']['name'];
        $extension = pathinfo($originalName, PATHINFO_EXTENSION);

        $cleanName = preg_replace('/[^A-Za-z0-9\-]/', '_', $customer_name);

        $safeDate = $date_of_order ?: date('Y-m-d');

        $fileName = "{$cleanName}-{$safeDate}.{$extension}";
        $filePath = $uploadDir . $fileName;

        if (move_uploaded_file($fileTmpPath, $filePath)) {
            $proof_path = 'proof_of_payment/' . $fileName;
        } else {
            throw new Exception("Failed to upload proof of payment image");
        }
    }


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
         mode_of_payment, payment_option, full_payment, fbilling_date, down_payment, dbilling_date,
         balance, total, latitude, longitude, proof_of_payment)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    if (!$stmt) throw new Exception($conn->error);

    $stmt->bind_param(
        "ssssssssdsdsdddds",
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
        $longitude,
        $proof_path
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
        "longitude" => $longitude,
        "proof_of_payment" => $proof_path
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

$conn->close();
?>
