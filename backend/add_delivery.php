<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$allowed_origins = [
    "https://cessie840.github.io",
    "http://localhost:5173",
    "http://localhost:5173/Envirocool-Tracking-Page"
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
    header("Access-Control-Allow-Credentials: true");
} else {
    header("Access-Control-Allow-Origin: http://localhost:5173");
    header("Access-Control-Allow-Credentials: true");
}

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

include 'database.php'; // your DB connection

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
    $opts = ["http" => ["header" => "User-Agent: DeliverySystem/1.0\r\n"]];
    $context = stream_context_create($opts);
    $response = @file_get_contents($url, false, $context);
    if ($response === FALSE) return [null, null];
    $data = json_decode($response, true);
    if (!empty($data) && isset($data[0]['lat']) && isset($data[0]['lon'])) {
        return [floatval($data[0]['lat']), floatval($data[0]['lon'])];
    }
    return [null, null];
}

function getGeocodedCoordinates($customer_address, $customer_barangay, $customer_city) {
    list($lat, $lng) = getCoordinatesFromAddress(trim($customer_address . ', Philippines'));
    if ($lat !== null && $lng !== null) return [$lat, $lng];

    if (!empty($customer_barangay) && !empty($customer_city)) {
        list($lat, $lng) = getCoordinatesFromAddress(trim("$customer_barangay, $customer_city, Philippines"));
        if ($lat !== null && $lng !== null) return [$lat, $lng];
    }

    if (!empty($customer_city)) {
        list($lat, $lng) = getCoordinatesFromAddress(trim("$customer_city, Philippines"));
        if ($lat !== null && $lng !== null) return [$lat, $lng];
    }

    return [14.1640, 121.4360];
}

function nullIfEmpty($value) {
    return isset($value) && $value !== '' ? $value : null;
}

try {
    // ---- POST Data ----
    $customer_name = $_POST['customer_name'] ?? '';
    $customer_address = $_POST['customer_address'] ?? '';
    $customer_province = $_POST['province'] ?? '';
    $customer_city = $_POST['city'] ?? '';
    $customer_barangay = $_POST['barangay'] ?? '';
    $customer_contact = $_POST['customer_contact'] ?? '';

    $date_of_order        = nullIfEmpty($_POST['date_of_order'] ?? null);
    $target_date_delivery = nullIfEmpty($_POST['target_date_delivery'] ?? null);
    $fbilling_date        = nullIfEmpty($_POST['fp_collection_date'] ?? null);
    $dbilling_date        = nullIfEmpty($_POST['dp_collection_date'] ?? null);

    $mode_of_payment = $_POST['payment_method'] ?? '';
    $payment_option  = $_POST['payment_option'] ?? '';
    $full_payment    = isset($_POST['full_payment']) ? floatval($_POST['full_payment']) : 0;
    $down_payment    = isset($_POST['down_payment']) ? floatval($_POST['down_payment']) : 0;
    $balance         = isset($_POST['balance']) ? floatval($_POST['balance']) : 0;
    $total           = isset($_POST['total']) ? floatval($_POST['total']) : 0;

    $order_items_json = $_POST['order_items'] ?? '[]';
    $order_items = json_decode($order_items_json, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Invalid order_items JSON: " . json_last_error_msg());
    }

    // Save location if provided
    if (!empty($customer_province) && !empty($customer_city) && !empty($customer_barangay)) {
        $checkQuery = "SELECT city_id FROM location WHERE province_name = ? AND city_name = ? AND barangay_name = ?";
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->bind_param("sss", $customer_province, $customer_city, $customer_barangay);
        $checkStmt->execute();
        $result = $checkStmt->get_result();

        if ($result->num_rows === 0) {
            $insertQuery = "INSERT INTO location (province_name, city_name, barangay_name) VALUES (?, ?, ?)";
            $insertStmt = $conn->prepare($insertQuery);
            $insertStmt->bind_param("sss", $customer_province, $customer_city, $customer_barangay);
            $insertStmt->execute();
            $insertStmt->close();
        }
        $checkStmt->close();
    }

    // ---- Proof of Payment Upload (supports multiple files) ----
    $proof_paths = [];
    if (!empty($_FILES['proofOfPayment']['name'][0])) { // if at least one file name exists
        $uploadDir = __DIR__ . '/uploads/proof_of_payment/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

        foreach ($_FILES['proofOfPayment']['tmp_name'] as $index => $fileTmpPath) {
            if (empty($fileTmpPath)) continue;
            $originalName = $_FILES['proofOfPayment']['name'][$index];
            $extension = pathinfo($originalName, PATHINFO_EXTENSION);
            $cleanName = preg_replace('/[^A-Za-z0-9\-]/', '_', substr($customer_name, 0, 40) ?: 'customer');
            $safeDate = $date_of_order ?: date('Y-m-d');
            $unique = uniqid();
            $fileName = "{$cleanName}-{$safeDate}-{$unique}-{$index}.{$extension}";
            $filePath = $uploadDir . $fileName;

            if (!move_uploaded_file($fileTmpPath, $filePath)) {
                throw new Exception("Failed to upload proof of payment image: $originalName");
            }
            // Store relative path (no leading slash) — view_deliveries will build full URL
            $proof_paths[] = 'uploads/proof_of_payment/' . $fileName;
        }
    }

    $proof_path_json = !empty($proof_paths) ? json_encode(array_values($proof_paths)) : null;

    // ---- Geocode ----
    list($latitude, $longitude) = getGeocodedCoordinates($customer_address, $customer_barangay, $customer_city);

    // ---- Insert Transaction ----
    $tracking_number = generateTrackingNumber();

    $stmt = $conn->prepare("INSERT INTO Transactions
        (tracking_number, customer_name, customer_address, customer_contact, date_of_order, target_date_delivery,
         mode_of_payment, payment_option, full_payment, fbilling_date, down_payment, dbilling_date,
         balance, total, latitude, longitude, proof_of_payment)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    if (!$stmt) throw new Exception($conn->error);

    // Bind params (types aligned to values above). Nulls are allowed for date/string fields.
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
        $proof_path_json
    );

    if (!$stmt->execute()) throw new Exception($stmt->error);
    $transaction_id = $conn->insert_id;
    $stmt->close();

    // ---- Insert PurchaseOrder items (with fallback) ----
    if (!empty($order_items)) {
        $stmt_product_check = $conn->prepare("
            SELECT product_id 
            FROM Product 
            WHERE TRIM(LOWER(type_of_product)) = TRIM(LOWER(?)) 
              AND TRIM(LOWER(description)) = TRIM(LOWER(?))
        ");
        $stmt_product_insert = $conn->prepare("INSERT INTO Product (type_of_product, description, unit_cost) VALUES (?, ?, 0)");
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
                $stmt_product_insert->bind_param("ss", $type_of_product, $description);
                if (!$stmt_product_insert->execute()) {
                    throw new Exception("Failed to insert new product: " . $stmt_product_insert->error);
                }
                $product_id = $conn->insert_id;
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
        $stmt_product_insert->close();
        $stmt_po->close();
    }

    error_log("Transaction saved successfully: ID $transaction_id, Tracking $tracking_number");

    echo json_encode([
        "status" => "success",
        "transaction_id" => $transaction_id,
        "tracking_number" => $tracking_number,
        "latitude" => $latitude,
        "longitude" => $longitude,
        "proof_of_payment" => $proof_path_json
    ]);

} catch (Exception $e) {
    error_log("Error in add_delivery.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

$conn->close();
?>
