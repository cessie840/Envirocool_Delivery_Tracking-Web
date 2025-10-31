<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

require_once "database.php";
error_reporting(E_ALL);
ini_set('display_errors', 1);

if ($_SERVER['REQUEST_METHOD'] === "OPTIONS") {
    http_response_code(200);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$transaction_id = isset($data["transaction_id"]) ? intval($data["transaction_id"]) : null;
$new_date = isset($data["target_date_delivery"]) ? $data["target_date_delivery"] : null;

if (!$transaction_id || !$new_date) {
    echo json_encode(["success" => false, "message" => "Missing transaction_id or new delivery date."]);
    exit;
}

$sql = "UPDATE Transactions SET rescheduled_date = ?, status = 'Pending' WHERE transaction_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("si", $new_date, $transaction_id);
$stmt->execute();
$updatedRows = $stmt->affected_rows;
$stmt->close();

$resetSql = "DELETE FROM DeliveryAssignments WHERE transaction_id = ?";
$stmtReset = $conn->prepare($resetSql);
$stmtReset->bind_param("i", $transaction_id);
$stmtReset->execute();
$deletedRows = $stmtReset->affected_rows;
$stmtReset->close();


$historySql = "INSERT INTO DeliveryHistory (transaction_id, event_type, reason, event_timestamp) VALUES (?, 'Rescheduled', ?, NOW())";
$stmtHist = $conn->prepare($historySql);
$stmtHist->bind_param("is", $transaction_id, $new_date);
$stmtHist->execute();
$stmtHist->close();


if ($updatedRows > 0) {
    echo json_encode([
        "success" => true,
        "message" => "Delivery rescheduled successfully.",
        "transaction_id" => $transaction_id,
        "new_date" => $new_date,
        "debug" => [
            "transactions_updated" => $updatedRows,
            "assignment_rows_deleted" => $deletedRows
        ]
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Transaction update affected 0 rows (check transaction_id).",
        "debug" => [
            "transactions_updated" => $updatedRows,
            "assignment_rows_deleted" => $deletedRows
        ]
    ]);
}

$conn->close();
?>
