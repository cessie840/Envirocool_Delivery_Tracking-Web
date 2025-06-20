<?php
session_start(); 
session_unset();
session_destroy();
session_start();

include 'database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: http://localhost:5173");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    http_response_code(200);
    exit();
}

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Credentials: true");

try {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->username) || !isset($data->password)) {
        http_response_code(400);
        echo json_encode(["error" => "Missing username or password"]);
        exit();
    }

    $username = $data->username;
    $password = $data->password;

    function checkUser($conn, $table, $user_col, $pass_col, $fields) {
        global $username, $password;

        $sql = "SELECT $user_col, $pass_col, $fields FROM $table WHERE $user_col = ?";
        $stmt = $conn->prepare($sql);

        if (!$stmt) {
            http_response_code(500);
            echo json_encode(["error" => "Database prepare failed"]);
            exit();
        }

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

    // ADMIN
    $user = checkUser($conn, "Admin", "ad_username", "ad_password", "ad_fname, ad_lname, ad_email, ad_phone");
    if ($user) {
        unset($_SESSION['manager_username'], $_SESSION['pers_username']); 
        $_SESSION['ad_username'] = $username;
        echo json_encode(["status" => "success", "user" => $user]);
        exit();
    }

    // OPERATIONAL MANAGER
    $user = checkUser($conn, "OperationalManager", "manager_username", "manager_password", "manager_fname, manager_lname, manager_email, manager_phone");
    if ($user) {
        unset($_SESSION['ad_username'], $_SESSION['pers_username']); 
        $_SESSION['manager_username'] = $username;
        echo json_encode(["status" => "success", "user" => $user]);
        exit();
    }

    // DELIVERY PERSONNEL
    $user = checkUser($conn, "DeliveryPersonnel", "pers_username", "pers_password", "pers_fname, pers_lname, pers_email, pers_phone, status, assignment_status");
    if ($user) {
        unset($_SESSION['ad_username'], $_SESSION['manager_username']); 
        $_SESSION['pers_username'] = $username;
        echo json_encode(["status" => "success", "user" => $user]);
        exit();
    }

    // User not found
    http_response_code(404);
    echo json_encode(["error" => "Invalid username"]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Server error", "message" => $e->getMessage()]);
}

$conn->close();
?>
