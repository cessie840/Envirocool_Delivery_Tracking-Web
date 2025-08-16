<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json");
require_once "database.php";

$type = isset($_GET['type']) ? $_GET['type'] : 'monthly';
$today = date('Y-m-d');
$ym = date('Y-m');

$out = [
  "successful_deliveries" => 0,
  "failed_deliveries" => 0,
  "total" => 0,
  "avg_rating" => "N/A",
  "reason_customer_didnt_receive" => 0,
  "reason_damaged_item" => 0
];

if ($type === 'daily') {
  // Prefer DeliverySummary for today
  $sql = "SELECT 
            COALESCE(SUM(successful_deliveries),0) AS succ,
            COALESCE(SUM(failed_deliveries),0) AS fail,
            COALESCE(SUM(reason_customer_didnt_receive),0) AS r1,
            COALESCE(SUM(reason_damaged_item),0) AS r2,
            CASE 
              WHEN SUM(customer_reviews_count) > 0 
              THEN ROUND(SUM(avg_rating * customer_reviews_count)/SUM(customer_reviews_count),2)
              ELSE NULL
            END AS avg_rating
          FROM DeliverySummary
          WHERE summary_date = CURDATE()";
  $res = $conn->query($sql);
  if ($res && $row = $res->fetch_assoc()) {
    $out["successful_deliveries"] = (int)$row["succ"];
    $out["failed_deliveries"] = (int)$row["fail"];
    $out["reason_customer_didnt_receive"] = (int)$row["r1"];
    $out["reason_damaged_item"] = (int)$row["r2"];
    $out["total"] = $out["successful_deliveries"] + $out["failed_deliveries"];
    if ($row["avg_rating"] !== null) $out["avg_rating"] = (float)$row["avg_rating"];
  }

  // Fallback compute from Transactions if summary is all zeros
  if ($out["total"] === 0) {
    $q = "SELECT 
            SUM(CASE WHEN status='Delivered' THEN 1 ELSE 0 END) AS succ,
            SUM(CASE WHEN status='Cancelled' THEN 1 ELSE 0 END) AS fail,
            AVG(customer_rating) AS ar
          FROM Transactions
          WHERE DATE(date_of_order) = CURDATE()";
    $rs = $conn->query($q);
    if ($rs && $r = $rs->fetch_assoc()) {
      $out["successful_deliveries"] = (int)$r["succ"];
      $out["failed_deliveries"] = (int)$r["fail"];
      $out["total"] = $out["successful_deliveries"] + $out["failed_deliveries"];
      if ($r["ar"] !== null) $out["avg_rating"] = round((float)$r["ar"], 2);
    }
  }

} else { // monthly
  $sql = "SELECT 
            COALESCE(SUM(successful_deliveries),0) AS succ,
            COALESCE(SUM(failed_deliveries),0) AS fail,
            COALESCE(SUM(reason_customer_didnt_receive),0) AS r1,
            COALESCE(SUM(reason_damaged_item),0) AS r2,
            CASE 
              WHEN SUM(customer_reviews_count) > 0 
              THEN ROUND(SUM(avg_rating * customer_reviews_count)/SUM(customer_reviews_count),2)
              ELSE NULL
            END AS avg_rating
          FROM DeliverySummary
          WHERE summary_month = DATE_FORMAT(CURDATE(), '%Y-%m')";
  $res = $conn->query($sql);
  if ($res && $row = $res->fetch_assoc()) {
    $out["successful_deliveries"] = (int)$row["succ"];
    $out["failed_deliveries"] = (int)$row["fail"];
    $out["reason_customer_didnt_receive"] = (int)$row["r1"];
    $out["reason_damaged_item"] = (int)$row["r2"];
    $out["total"] = $out["successful_deliveries"] + $out["failed_deliveries"];
    if ($row["avg_rating"] !== null) $out["avg_rating"] = (float)$row["avg_rating"];
  }

  // Fallback compute from Transactions if summary is all zeros
  if ($out["total"] === 0) {
    $q = "SELECT 
            SUM(CASE WHEN status='Delivered' THEN 1 ELSE 0 END) AS succ,
            SUM(CASE WHEN status='Cancelled' THEN 1 ELSE 0 END) AS fail,
            AVG(customer_rating) AS ar
          FROM Transactions
          WHERE DATE_FORMAT(date_of_order, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')";
    $rs = $conn->query($q);
    if ($rs && $r = $rs->fetch_assoc()) {
      $out["successful_deliveries"] = (int)$r["succ"];
      $out["failed_deliveries"] = (int)$r["fail"];
      $out["total"] = $out["successful_deliveries"] + $out["failed_deliveries"];
      if ($r["ar"] !== null) $out["avg_rating"] = round((float)$r["ar"], 2);
    }
  }
}

header('Content-Type: application/json');
echo json_encode($out);
