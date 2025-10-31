<?php 
define('DB_HOST', 'localhost'); 
define('DB_USERNAME', 'root'); 
define('DB_PASSWORD', 'mabangis'); 
define('DB_NAME', 'DeliveryTrackingSystem');

date_default_timezone_set('Asia/Karachi');

$db = new mysqli(DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME); 

if ($db->connect_errno) { 
    echo "Connection to database is failed: ".$db->connect_error;
    exit();
}