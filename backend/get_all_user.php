<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
    header("Access-Control-Allow-Credentials: true"); // allow cookies/session
}

header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle preflight requests
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

    // Fetch Admins
    $sqlAdmin = "SELECT ad_username, ad_fname, ad_lname, ad_email, ad_phone FROM Admin ORDER BY ad_username ASC";
    $resultAdmin = $conn->query($sqlAdmin);
    $users['admins'] = $resultAdmin ? $resultAdmin->fetch_all(MYSQLI_ASSOC) : [];

    // Fetch Operational Managers
    $sqlManager = "SELECT manager_username, manager_fname, manager_lname, manager_email, manager_phone FROM OperationalManager ORDER BY manager_username ASC";
    $resultManager = $conn->query($sqlManager);
    $users['managers'] = $resultManager ? $resultManager->fetch_all(MYSQLI_ASSOC) : [];

    // Fetch Delivery Personnel
    $sqlPersonnel = "SELECT pers_username, pers_fname, pers_lname, pers_email, pers_phone, status, assignment_status FROM DeliveryPersonnel ORDER BY pers_username ASC";
    $resultPersonnel = $conn->query($sqlPersonnel);
    $users['personnel'] = $resultPersonnel ? $resultPersonnel->fetch_all(MYSQLI_ASSOC) : [];

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
