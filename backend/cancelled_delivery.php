<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once "database.php";

if ($_SERVER['REQUEST_METHOD'] === "OPTIONS") {
    http_response_code(200);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$transaction_id = isset($data["transaction_id"]) ? intval($data["transaction_id"]) : null;
$reason = isset($data["reason"]) ? trim($data["reason"]) : null;

if (!$transaction_id || empty($reason)) {
    echo json_encode([
        "success" => false,
        "message" => "Missing required fields (transaction_id or reason)."
    ]);
    exit;
}

// ✅ Check if transaction exists
$check = $conn->prepare("SELECT * FROM Transactions WHERE transaction_id = ?");
$check->bind_param("i", $transaction_id);
$check->execute();
$result = $check->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Transaction not found."
    ]);
    exit;
}

// ✅ Update Transactions table
$update = $conn->prepare("
    UPDATE Transactions 
    SET status = 'Cancelled', cancelled_reason = ?, cancelled_at = NOW() 
    WHERE transaction_id = ?
");
$update->bind_param("si", $reason, $transaction_id);

if ($update->execute()) {
    // ✅ Update DeliveryDetails table (if exists)
    $updDetails = $conn->prepare("
        UPDATE DeliveryDetails 
        SET delivery_status = 'Cancelled', cancellation_reason = ?, cancelled_at = NOW() 
        WHERE transaction_id = ?
    ");
    $updDetails->bind_param("si", $reason, $transaction_id);
    $updDetails->execute();
    $updDetails->close();

    // ✅ INSERT into DeliveryHistory (keeps permanent record)
    $insertHist = $conn->prepare("
        INSERT INTO DeliveryHistory (transaction_id, event_type, reason, event_timestamp) 
        VALUES (?, 'Cancelled', ?, NOW())
    ");
    $insertHist->bind_param("is", $transaction_id, $reason);
    $insertHist->execute();
    $insertHist->close();

    // ✅ Update DeliverySummary (for dashboard counts)
    $summary_date = date("Y-m-d");
    $summary_month = date("Y-m");

    $checkSummary = $conn->prepare("SELECT * FROM DeliverySummary WHERE summary_date = ?");
    $checkSummary->bind_param("s", $summary_date);
    $checkSummary->execute();
    $summaryResult = $checkSummary->get_result();

    if ($summaryResult->num_rows > 0) {
        // Update existing summary
        if (stripos($reason, 'location') !== false) {
            $conn->query("UPDATE DeliverySummary 
                          SET failed_deliveries = failed_deliveries + 1,
                              location_reason = location_reason + 1
                          WHERE summary_date = '$summary_date'");
        } elseif (stripos($reason, 'vehicle') !== false) {
            $conn->query("UPDATE DeliverySummary 
                          SET failed_deliveries = failed_deliveries + 1,
                              vehicle_reason = vehicle_reason + 1
                          WHERE summary_date = '$summary_date'");
        } else {
            $conn->query("UPDATE DeliverySummary 
                          SET failed_deliveries = failed_deliveries + 1
                          WHERE summary_date = '$summary_date'");
        }
    } else {
        // Insert new summary row
        $location_reason = 0;
        $vehicle_reason = 0;
        if (stripos($reason, 'location') !== false) {
            $location_reason = 1;
        } elseif (stripos($reason, 'vehicle') !== false) {
            $vehicle_reason = 1;
        }
        $insertSummary = $conn->prepare("
            INSERT INTO DeliverySummary 
            (summary_date, summary_month, failed_deliveries, location_reason, vehicle_reason) 
            VALUES (?, ?, 1, ?, ?)
        ");
        $insertSummary->bind_param("ssii", $summary_date, $summary_month, $location_reason, $vehicle_reason);
        $insertSummary->execute();
        $insertSummary->close();
    }

    echo json_encode([
        "success" => true,
        "message" => "Delivery successfully cancelled.",
        "transaction_id" => $transaction_id,
        "reason" => $reason
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Failed to update transaction.",
        "error_detail" => $conn->error
    ]);
}

$update->close();
$conn->close();
?>
