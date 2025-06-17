<?php

include 'database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
header("Access-Control-Allow-Origin: http://localhost:5173");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    http_response_code(200);
    exit();
}

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");
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
            echo json_encode(["error" => "db_error"]);
            exit();
        }

        $stmt->bind_param("s", $username);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($row = $result->fetch_assoc()) {
            if (password_verify($password, $row[$pass_col])) {
                unset($row[$pass_col]);
                $row["role"] = strtolower($table);
                return ["status" => "success", "user" => $row];
            } else {
                return ["error" => "Invalid password"];
            }
        }

        return null; // Username not found in this table
    }

    $tables = [
        ["Admin", "ad_username", "ad_password", "ad_fname, ad_lname, ad_email, ad_phone"],
        ["OperationalManager", "manager_username", "manager_password", "manager_fname, manager_lname, manager_email, manager_phone"],
        ["DeliveryPersonnel", "pers_username", "pers_password", "pers_fname, pers_lname, pers_email, pers_phone"]
    ];

    foreach ($tables as $table) {
        [$tableName, $user_col, $pass_col, $fields] = $table;
        $result = checkUser($conn, $tableName, $user_col, $pass_col, $fields);

        if (is_array($result)) {
            if (isset($result['status']) && $result['status'] === 'success') {
                http_response_code(200);
                echo json_encode($result);
                exit();
            } elseif (isset($result['error']) && $result['error'] === 'Invalid password') {
                http_response_code(401);
                echo json_encode(["error" => "Invalid password"]);
                exit();
            }
        }
    }

    // If no user found in any table
    http_response_code(404);
    echo json_encode(["error" => "Invalid username"]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "server_error"]);
}

$conn->close();
?>
