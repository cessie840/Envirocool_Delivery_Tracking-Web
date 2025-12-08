<?php
header('Content-Type: application/json');

// 🔹 Allow CORS (so React localhost can call this)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

include 'database.php'; // your database connection

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

$username   = $data['username'] ?? '';
$role       = $data['role'] ?? '';
$permission = $data['permission'] ?? '';
$value      = isset($data['value']) ? (int)$data['value'] : 0;

if (!$username || !$role || !$permission) {
    echo json_encode(['success' => false, 'message' => 'Invalid data']);
    exit;
}

// Determine the table and username column
switch ($role) {
    case 'admin':
        $table = 'Admin';
        $userColumn = 'ad_username';
        break;
    case 'operationalmanager':
        $table = 'OperationalManager';
        $userColumn = 'manager_username';
        break;
    case 'deliverypersonnel':
        $table = 'DeliveryPersonnel';
        $userColumn = 'pers_username';
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid role']);
        exit;
}

// 🔹 Fetch current permissions
$sql = "SELECT permissions FROM `$table` WHERE `$userColumn` = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('s', $username);
$stmt->execute();
$result = $stmt->get_result();
if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'User not found']);
    exit;
}

$row = $result->fetch_assoc();
$permissions = json_decode($row['permissions'], true) ?? [];

// 🔹 Update permission
$permissions[$permission] = $value;

// 🔹 Save back to DB
$permissionsJson = json_encode($permissions, JSON_UNESCAPED_UNICODE);
$updateSql = "UPDATE `$table` SET permissions = ? WHERE `$userColumn` = ?";
$stmtUpdate = $conn->prepare($updateSql);
$stmtUpdate->bind_param('ss', $permissionsJson, $username);

if ($stmtUpdate->execute()) {
    echo json_encode(['success' => true, 'message' => 'Permission updated']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to update permission']);
}
?>
