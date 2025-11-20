<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit;
}

$transaction_id = $_POST['transaction_id'] ?? null;
$full_payment = $_POST['full_payment'] ?? 0;
$balance = $_POST['balance'] ?? null;
$fbilling_date = $_POST['fbilling_date'] ?? null;
$payments_json = $_POST['payments'] ?? null;

if (!$transaction_id) {
    echo json_encode(['status' => 'error', 'message' => 'Transaction ID is required']);
    exit;
}

// Decode new payments
$payments = [];
if ($payments_json) {
    $decoded = json_decode($payments_json, true);
    if (is_array($decoded)) {
        foreach ($decoded as $p) {
            if (isset($p['amount']) && is_numeric($p['amount'])) {
                $payments[] = [
                    'amount' => round(floatval($p['amount']), 2),
                    'date' => $p['date'] ?? date('Y-m-d')
                ];
            }
        }
    }
}

// Upload directory
$uploadDir = 'uploads/proof_of_payment/';
if (!is_dir($uploadDir))
    mkdir($uploadDir, 0755, true);

// Fetch current transaction
$query = "SELECT total, down_payment, full_payment, balance, proof_of_payment, payments 
          FROM transactions WHERE transaction_id = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param('s', $transaction_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['status' => 'error', 'message' => 'Transaction not found']);
    exit;
}

$row = $result->fetch_assoc();
$total = floatval($row['total']);
$down_payment = floatval($row['down_payment']);

// Existing proofs
$existing_proof = [];
if (!empty($row['proof_of_payment'])) {
    $decoded = json_decode($row['proof_of_payment'], true);
    $existing_proof = is_array($decoded)
        ? $decoded
        : array_filter(explode(',', $row['proof_of_payment']));
}

// Existing payments
$existing_payments = json_decode($row['payments'] ?? '[]', true);
if (!is_array($existing_payments))
    $existing_payments = [];

// Handle file uploads
$newProofs = [];
$date = date('Y-m-d');
if (!empty($_FILES['proof_files']['name'][0])) {
    foreach ($_FILES['proof_files']['name'] as $i => $fileName) {
        $fileTmp = $_FILES['proof_files']['tmp_name'][$i];
        $fileType = $_FILES['proof_files']['type'][$i];

        if (!in_array($fileType, ['image/jpeg', 'image/png'])) {
            echo json_encode(['status' => 'error', 'message' => "Invalid file type for $fileName"]);
            exit;
        }

        $ext = pathinfo($fileName, PATHINFO_EXTENSION);
        $newName = "DP-PROOF_{$transaction_id}_{$date}_" . uniqid() . ".{$ext}";
        $targetPath = $uploadDir . $newName;

        if (move_uploaded_file($fileTmp, $targetPath)) {
            $newProofs[] = $targetPath;
        } else {
            echo json_encode(['status' => 'error', 'message' => "Failed to upload $fileName"]);
            exit;
        }
    }
}

// Merge proofs + payments
$mergedProofs = array_values(array_merge($existing_proof, $newProofs));
$mergedPayments = array_values(array_merge($existing_payments, $payments));

// Recompute totals
$total_paid = $down_payment;
foreach ($mergedPayments as $p)
    $total_paid += floatval($p['amount']);

$total_full_payment = 0;
foreach ($mergedPayments as $p)
    $total_full_payment += floatval($p['amount']);

$new_balance = max($total - $total_paid, 0);

// Encode for DB
$payments_encoded = json_encode($mergedPayments, JSON_UNESCAPED_UNICODE);
$proof_encoded = json_encode($mergedProofs, JSON_UNESCAPED_UNICODE);

// Update main transaction
$update = "UPDATE transactions 
           SET payments = ?, 
               full_payment = ?, 
               balance = ?, 
               fbilling_date = ?, 
               proof_of_payment = ?
           WHERE transaction_id = ?";

$stmt = $conn->prepare($update);
$stmt->bind_param('sddssi', $payments_encoded, $total_full_payment, $new_balance, $fbilling_date, $proof_encoded, $transaction_id);

if ($stmt->execute()) {

    // ✅ LOG PAYMENT HISTORY
    if ($full_payment > 0) {
        $proofLog = json_encode($newProofs, JSON_UNESCAPED_UNICODE);
        $log = $conn->prepare(
            "INSERT INTO payment_history (transaction_id, amount, payment_date, proof_files)
             VALUES (?, ?, ?, ?)"
        );
        $log->bind_param('sdss', $transaction_id, $full_payment, $fbilling_date, $proofLog);
        $log->execute();
        $log->close();
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Order updated successfully',
        'total_paid' => $total_paid,
        'new_balance' => $new_balance,
        'payments' => $mergedPayments,
        'proof_of_payment' => $mergedProofs
    ]);

} else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to update database']);
}

$stmt->close();
$conn->close();
?>