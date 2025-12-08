<?php
session_start();

header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

include 'database.php';

$current_user = null;
$role = null;

if (isset($_SESSION['ad_username'])) {
    $current_user = $_SESSION['ad_username'];
    $role = 'Admin';
} elseif (isset($_SESSION['manager_username'])) {
    $current_user = $_SESSION['manager_username'];
    $role = 'OperationalManager';
} elseif (isset($_SESSION['pers_username'])) {
    $current_user = $_SESSION['pers_username'];
    $role = 'DeliveryPersonnel';
} else {
    echo json_encode([
        "success" => false,
        "message" => "Not logged in"
    ]);
    exit();
}

try {
    $permissions = [];

    if ($role === 'Admin') {
        $stmt = $conn->prepare("SELECT IFNULL(permissions, '{}') AS permissions FROM Admin WHERE ad_username = ?");
        $stmt->bind_param("s", $current_user);
    } elseif ($role === 'OperationalManager') {
        $stmt = $conn->prepare("SELECT IFNULL(permissions, '{}') AS permissions FROM OperationalManager WHERE manager_username = ?");
        $stmt->bind_param("s", $current_user);
    } else { // DeliveryPersonnel
        $stmt = $conn->prepare("SELECT IFNULL(permissions, '{}') AS permissions FROM DeliveryPersonnel WHERE pers_username = ?");
        $stmt->bind_param("s", $current_user);
    }

    $stmt->execute();
    $result = $stmt->get_result();
    if ($row = $result->fetch_assoc()) {
        $permissions = json_decode($row['permissions'], true);
    }

    echo json_encode([
        "success" => true,
        "username" => $current_user,
        "role" => $role,
        "permissions" => $permissions
    ]);

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
