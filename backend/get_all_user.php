<?php
// Allow requests from your frontend
header('Access-Control-Allow-Origin: http://localhost:5173'); // or '*'
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true'); // since you use withCredentials

header('Content-Type: application/json');
include 'database.php'; // your database connection

$response = ['success' => false, 'data' => []];

try {
    // ================================
    // Fetch Admins
    // ================================
    $adminSql = "SELECT ad_username AS username, IFNULL(permissions, '{}') AS permissions FROM Admin";
    $adminResult = $conn->query($adminSql);
    $admins = [];
    while ($row = $adminResult->fetch_assoc()) {
        $row['permissions'] = json_decode($row['permissions'], true);
        $admins[] = $row;
    }

    // ================================
    // Fetch Operational Managers
    // ================================
    $managerSql = "SELECT manager_username AS username, IFNULL(permissions, '{}') AS permissions FROM OperationalManager";
    $managerResult = $conn->query($managerSql);
    $managers = [];
    while ($row = $managerResult->fetch_assoc()) {
        $row['permissions'] = json_decode($row['permissions'], true);
        $managers[] = $row;
    }

    // ================================
    // Fetch Delivery Personnel
    // ================================
    $persSql = "SELECT pers_username AS username, IFNULL(permissions, '{}') AS permissions FROM DeliveryPersonnel";
    $persResult = $conn->query($persSql);
    $personnel = [];
    while ($row = $persResult->fetch_assoc()) {
        $row['permissions'] = json_decode($row['permissions'], true);
        $personnel[] = $row;
    }

    $response['success'] = true;
    $response['data'] = [
        'admins' => $admins,
        'managers' => $managers,
        'personnel' => $personnel
    ];

} catch (Exception $e) {
    $response['success'] = false;
    $response['message'] = $e->getMessage();
}

echo json_encode($response);
?>
