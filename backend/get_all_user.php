<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
    header("Access-Control-Allow-Credentials: true");
}

header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(["success" => true, "message" => "Preflight OK"]);
    exit();
}

include 'database.php';

$response = [
    "success" => false,
    "message" => "",
    "data" => []
];

try {
    $users = [];

    // Helper function to get permissions for a user
    function get_permissions($username, $role, $conn, $default) {
        $stmt = $conn->prepare("SELECT permissions FROM user_permissions WHERE username=? AND role=?");
        $stmt->bind_param("ss", $username, $role);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($row = $result->fetch_assoc()) {
            return json_decode($row['permissions'], true);
        }
        return $default;
    }

    // Default permissions per role
    $defaultAdminPerms = [
        "Create Transaction"=>true,
        "Update Transaction"=>true,
        "View Deliveries"=>true,
        "Monitor Deliveries"=>true,
        "Generate Reports"=>false,
        "Create Delivery Account"=>false
    ];
    $defaultManagerPerms = [
        "Assign Delivery"=>true,
        "View Delivery Details"=>true,
        "Create Delivery Account"=>false,
        "Reschedule Deliverie"=>true,
    ];
    $defaultDeliveryPerms = [
        "View Assigned Deliveries"=>true,
        "Update Delivery Status"=>true
    ];

    // Fetch Admins
    $sqlAdmin = "SELECT ad_username, ad_fname, ad_lname, ad_email, ad_phone 
                 FROM Admin 
                 WHERE LOWER(ad_username) != 'systemadmin'
                 ORDER BY ad_username ASC";
    $resultAdmin = $conn->query($sqlAdmin);
    $users['admins'] = [];
    if ($resultAdmin) {
        while ($row = $resultAdmin->fetch_assoc()) {
            $row['permissions'] = get_permissions($row['ad_username'], 'admin', $conn, $defaultAdminPerms);
            $users['admins'][] = $row;
        }
    }

    // Fetch Operational Managers
    $sqlManager = "SELECT manager_username, manager_fname, manager_lname, manager_email, manager_phone 
                   FROM OperationalManager 
                   ORDER BY manager_username ASC";
    $resultManager = $conn->query($sqlManager);
    $users['managers'] = [];
    if ($resultManager) {
        while ($row = $resultManager->fetch_assoc()) {
            $row['permissions'] = get_permissions($row['manager_username'], 'operational-manager', $conn, $defaultManagerPerms);
            $users['managers'][] = $row;
        }
    }

    // Fetch Delivery Personnel
    $sqlPersonnel = "SELECT pers_username, pers_fname, pers_lname, pers_email, pers_phone, status, assignment_status 
                     FROM DeliveryPersonnel 
                     ORDER BY pers_username ASC";
    $resultPersonnel = $conn->query($sqlPersonnel);
    $users['personnel'] = [];
    if ($resultPersonnel) {
        while ($row = $resultPersonnel->fetch_assoc()) {
            $row['permissions'] = get_permissions($row['pers_username'], 'delivery-personnel', $conn, $defaultDeliveryPerms);
            $users['personnel'][] = $row;
        }
    }

    $response['success'] = true;
    $response['message'] = "Users fetched successfully.";
    $response['data'] = $users;

} catch (Exception $e) {
    $response['success'] = false;
    $response['message'] = "Error: " . $e->getMessage();
}

echo json_encode($response);

$conn->close();
?>
