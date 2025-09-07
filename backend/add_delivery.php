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


try {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data) throw new Exception("No input data");

    $customer_name        = $data['customer_name'] ?? '';
    $customer_address     = $data['customer_address'] ?? '';
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

    $order_items = $data['order_items'] ?? [];

 
    $tracking_number = generateTrackingNumber();


    $stmt = $conn->prepare("INSERT INTO Transactions
        (tracking_number, customer_name, customer_address, customer_contact, date_of_order, target_date_delivery,
         mode_of_payment, payment_option, full_payment, fbilling_date, down_payment, dbilling_date, balance, total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    if (!$stmt) throw new Exception($conn->error);

    $stmt->bind_param(
        "ssssssssdsdsdd",
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
        $total
    );

    if (!$stmt->execute()) throw new Exception($stmt->error);

    $transaction_id = $conn->insert_id;
    $stmt->close();

  
    if (!empty($order_items)) {
        $stmt_product_check = $conn->prepare("SELECT product_id FROM Product WHERE type_of_product = ? AND description = ?");
        $stmt_product_insert = $conn->prepare("INSERT INTO Product (type_of_product, description, unit_cost) VALUES (?, ?, ?)");
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
                $stmt_product_insert->bind_param("ssd", $type_of_product, $description, $unit_cost);
                if (!$stmt_product_insert->execute()) {
                    throw new Exception("Product insert failed: " . $stmt_product_insert->error);
                }
                $product_id = $stmt_product_insert->insert_id;
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

    echo json_encode([
        "status" => "success",
        "transaction_id" => $transaction_id,
        "tracking_number" => $tracking_number
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
