<?php
include 'database.php'; // your DB connection

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $tracking_number = trim($_POST['tracking_number'] ?? '');

    if ($tracking_number === '') {
        echo json_encode(['success' => false, 'message' => 'Tracking number required']);
        exit;
    }

    $stmt = $db->prepare("SELECT * FROM Transactions WHERE tracking_number = ?");
    $stmt->bind_param("s", $tracking_number);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        echo json_encode(['success' => true, 'tracking_number' => $row['tracking_number']]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid tracking number']);
    }

    $stmt->close();
    $db->close();
}
?>
