<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json");
require_once "database.php";

$type = isset($_GET['type']) ? $_GET['type'] : 'monthly';
$date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
$month = isset($_GET['date']) ? $_GET['date'] : date('Y-m');

$out = [
  "successful_deliveries" => 0,
  "failed_deliveries" => 0,
  "total" => 0,
  "avg_rating" => "N/A",
  "reason_customer_didnt_receive" => 0,
  "reason_damaged_item" => 0
];

if ($type === 'daily') {
  // Use selected date
  $sql = "SELECT 
            COALESCE(SUM(successful_deliveries),0) AS succ,
            COALESCE(SUM(failed_deliveries),0) AS fail,
            COALESCE(SUM(reason_customer_didnt_receive),0) AS r1,
            COALESCE(SUM(reason_damaged_item),0) AS r2,
            AVG(rating) AS avg_rating
          FROM DeliverySummary
          WHERE summary_date = ?";
  $stmt = $conn->prepare($sql);
  $stmt->bind_param("s", $date);
  $stmt->execute();
  $res = $stmt->get_result();
  if ($res && $row = $res->fetch_assoc()) {
    $out["successful_deliveries"] = (int)$row["succ"];
    $out["failed_deliveries"] = (int)$row["fail"];
    $out["reason_customer_didnt_receive"] = (int)$row["r1"];
    $out["reason_damaged_item"] = (int)$row["r2"];
    $out["avg_rating"] = $row["avg_rating"] !== null ? round($row["avg_rating"], 2) : "N/A";
    $out["total"] = $out["successful_deliveries"] + $out["failed_deliveries"];
  }
  $stmt->close();

  // Fallback: compute from Transactions if summary is all zeros
  if ($out["total"] === 0) {
    $sql = "SELECT 
              SUM(CASE WHEN status='Delivered' THEN 1 ELSE 0 END) AS succ,
              SUM(CASE WHEN status='Cancelled' THEN 1 ELSE 0 END) AS fail
            FROM Transactions
            WHERE DATE(date_of_order) = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $date);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res && $row = $res->fetch_assoc()) {
      $out["successful_deliveries"] = (int)$row["succ"];
      $out["failed_deliveries"] = (int)$row["fail"];
      $out["total"] = $out["successful_deliveries"] + $out["failed_deliveries"];
    }
    $stmt->close();
  }

} else { // monthly
  // Use selected month (YYYY-MM)
  $sql = "SELECT 
    COALESCE(SUM(successful_deliveries),0) AS succ,
    COALESCE(SUM(failed_deliveries),0) AS fail,
    COALESCE(SUM(reason_customer_didnt_receive),0) AS r1,
    COALESCE(SUM(reason_damaged_item),0) AS r2,
    AVG(avg_rating) AS avg_rating
  FROM DeliverySummary
  WHERE summary_month = ?";
  $stmt = $conn->prepare($sql);
  $stmt->bind_param("s", $month);
  $stmt->execute();
  $res = $stmt->get_result();
  if ($res && $row = $res->fetch_assoc()) {
    $out["successful_deliveries"] = (int)$row["succ"];
    $out["failed_deliveries"] = (int)$row["fail"];
    $out["reason_customer_didnt_receive"] = (int)$row["r1"];
    $out["reason_damaged_item"] = (int)$row["r2"];
    $out["avg_rating"] = $row["avg_rating"] !== null ? round($row["avg_rating"], 2) : "N/A";
    $out["total"] = $out["successful_deliveries"] + $out["failed_deliveries"];
  }
  $stmt->close();

  // Fallback: compute from Transactions if summary is all zeros
  if ($out["total"] === 0) {
    $sql = "SELECT 
              SUM(CASE WHEN status='Delivered' THEN 1 ELSE 0 END) AS succ,
              SUM(CASE WHEN status='Cancelled' THEN 1 ELSE 0 END) AS fail
            FROM Transactions
            WHERE DATE_FORMAT(date_of_order, '%Y-%m') = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $month);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res && $row = $res->fetch_assoc()) {
      $out["successful_deliveries"] = (int)$row["succ"];
      $out["failed_deliveries"] = (int)$row["fail"];
      $out["total"] = $out["successful_deliveries"] + $out["failed_deliveries"];
    }
    $stmt->close();
  }
}

echo json_encode($out);
