<?php
include 'database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: http://localhost:5173");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
    http_response_code(200);
    exit();
}

// header("Access-Control-Allow-Headers: Content-Type");
// header("Access-Control-Allow-Methods: POST");
// header("Content-Type: application/json; charset=UTF-8");

// header("Access-Control-Allow-Credentials: true");


// Get POST data
$data = json_decode(file_get_contents("php://input"));
file_put_contents("debug_log.txt", json_encode($data));

//ERROR HANDLER - NO USERNAME/PASSWORD SENT
if (!isset($data->username) || !isset($data->password)) {
    http_response_code(400);
    echo json_encode(["error" => "Missing username or password"]);
    exit();
}

//ROLE-BASED ACCESS API
$username = $data->username;
$password = $data->password;

function checkUser($conn, $table, $user_col, $pass_col, $fields) {
    global $username, $password;

    $sql = "SELECT $user_col, $pass_col, $fields FROM $table WHERE $user_col = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        if (password_verify($password, $row[$pass_col])) {
            unset($row[$pass_col]);
            $row["role"] = strtolower($table);
            return $row;
        } else {
            http_response_code(401);
            echo json_encode(["error" => "Invalid password"]);
            exit();
        }
    }

    return null;
}

// Check Admin table
$user = checkUser($conn, "Admin", "ad_username", "ad_password", "ad_fname, ad_lname, ad_email, ad_phone");
if ($user) {
    echo json_encode(["status" => "success", "user" => $user]);
    exit();
}

// Check Manager table
$user = checkUser($conn, "OperationalManager", "manager_username", "manager_password", "manager_fname, manager_lname, manager_email, manager_phone");
if ($user) {
    echo json_encode(["status" => "success", "user" => $user]);
    exit();
}

//ERROR HANDLER - NO USER FOUND
http_response_code(404);
echo json_encode(["error" => "User not found"]);
$conn->close(); //close database connection
?>
