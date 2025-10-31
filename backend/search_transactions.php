<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');
include 'database.php';

$search = $_GET['q'] ?? '';

$sql = "SELECT * FROM Transactions 
        WHERE customer_name LIKE ? OR customer_contact LIKE ? OR customer_address LIKE ? 
        ORDER BY created_at DESC";

$stmt = $conn->prepare($sql);
$searchTerm = "%$search%";
$stmt->bind_param("sss", $searchTerm, $searchTerm, $searchTerm);
$stmt->execute();

$result = $stmt->get_result();
$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);
?>
