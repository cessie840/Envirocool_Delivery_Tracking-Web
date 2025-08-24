# Envirocool_Delivery-Tracking-Web

## The purpose of this repository is to manage the version history for the development of our capstone project named "Web-Based Delivery Tracking with Data Analytics"

**DATABASE SQL**
CREATE DATABASE DeliveryTrackingSystem;
USE DeliveryTrackingSystem;

CREATE TABLE Admin (
    ad_username VARCHAR(100) PRIMARY KEY,
    ad_password VARCHAR(100),
    ad_fname VARCHAR(100),
    ad_lname VARCHAR(100),
    ad_email VARCHAR(100),
    ad_phone VARCHAR(15),
    ad_resetToken VARCHAR(100),
    reset_expire DATETIME,
    reset_requested_at DATETIME,
    attempts INT DEFAULT 0,
    lock_until DATETIME DEFAULT NULL
);

CREATE TABLE OperationalManager (
    manager_username VARCHAR(100) PRIMARY KEY,
    manager_password VARCHAR(100),
    manager_fname VARCHAR(100),
    manager_lname VARCHAR(100),
    manager_email VARCHAR(100),
    manager_phone VARCHAR(15),
    manager_resetToken VARCHAR(100),
    reset_expire DATETIME,
    reset_requested_at DATETIME,
    attempts INT DEFAULT 0,
    lock_until DATETIME DEFAULT NULL
);

CREATE TABLE DeliveryPersonnel (
    pers_username VARCHAR(100) PRIMARY KEY,
    pers_password VARCHAR(100),
    pers_fname VARCHAR(100),
    pers_lname VARCHAR(100),
    pers_age INT,
    pers_gender VARCHAR(100),
    pers_birth DATE,
    pers_phone VARCHAR(11),
    status ENUM('Active','Inactive') DEFAULT 'Active',
    assignment_status ENUM('Available', 'Assigned') DEFAULT 'Available',
    assigned_transaction_id INT DEFAULT NULL,
    pers_resetToken VARCHAR(100),
    reset_expire DATETIME,
    reset_requested_at DATETIME,
    pers_profile_pic VARCHAR(255) DEFAULT 'default-profile-pic.png',
    pers_email VARCHAR(255),
    attempts INT DEFAULT 0,
    lock_until DATETIME DEFAULT NULL
);

CREATE TABLE Transactions ( 
transaction_id INT AUTO_INCREMENT PRIMARY KEY, 
customer_name VARCHAR(255), 
customer_address TEXT, 
customer_contact VARCHAR(20), 
date_of_order DATE, 
mode_of_payment ENUM('Cash', 'COD', 'Card'), 
down_payment DECIMAL(10,2), 
balance DECIMAL(10,2), 
total DECIMAL(10,2), 
status ENUM('Pending', 'To Ship', 'Out for Delivery', 'Delivered', 'Cancelled') DEFAULT 'Pending', 
customer_rating DECIMAL(3,1) DEFAULT NULL, 
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ) AUTO_INCREMENT = 100001;

ALTER TABLE Transactions 
ADD COLUMN completed_at DATETIME NULL AFTER status;

ALTER TABLE Transactions 
ADD COLUMN shipout_at DATETIME NULL AFTER status;

ALTER TABLE Transactions
ADD COLUMN cancelled_reason TEXT NULL AFTER status;

ALTER TABLE Transactions
ADD COLUMN cancelled_at DATETIME NULL AFTER status;


CREATE TABLE PurchaseOrder (
    po_id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_id INT,
    quantity INT,
    description TEXT,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    FOREIGN KEY (transaction_id) REFERENCES Transactions(transaction_id) ON DELETE CASCADE
) AUTO_INCREMENT = 500001;


CREATE TABLE DeliveryAssignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT,
    personnel_username VARCHAR(100),
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES Transactions(transaction_id) ON DELETE CASCADE,
    FOREIGN KEY (personnel_username) REFERENCES DeliveryPersonnel(pers_username) ON DELETE SET NULL
);

CREATE TABLE DeliveryDetails (
    delivery_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT,
    po_id INT,
    delivery_status ENUM('Pending', 'To Ship' ,'Out for Delivery', 'Delivered', 'Cancelled') DEFAULT 'Pending',
    cancellation_reason TEXT NULL,
    cancelled_at DATETIME NULL,
    status ENUM('OutForDelivery', 'Delivered', 'Cancelled') DEFAULT 'OutForDelivery',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES Transactions(transaction_id) ON DELETE CASCADE,
    FOREIGN KEY (po_id) REFERENCES PurchaseOrder(po_id) ON DELETE CASCADE
);

CREATE TABLE coords (
    transaction_id INT PRIMARY KEY,
    from_lat DOUBLE,
    from_lng DOUBLE,
    to_lat DOUBLE,
    to_lng DOUBLE,
    FOREIGN KEY (transaction_id) REFERENCES Transactions(transaction_id) ON DELETE CASCADE
);

CREATE TABLE DeliverySummary (
    summary_id INT AUTO_INCREMENT PRIMARY KEY,
    summary_date DATE,
    summary_month VARCHAR(7),
    successful_deliveries INT DEFAULT 0,
    failed_deliveries INT DEFAULT 0,
    customer_reviews_count INT DEFAULT 0,
    avg_rating DECIMAL(3,2) DEFAULT 0,
    reason_customer_didnt_receive INT DEFAULT 0,
    reason_damaged_item INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE TopSellingItems (
    top_item_id INT AUTO_INCREMENT PRIMARY KEY,
    month VARCHAR(7),
    item_name VARCHAR(255),
    quantity_sold INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



INSERT INTO Admin (ad_username, ad_password, ad_fname, ad_lname, ad_email, ad_phone)
VALUES (
    'admin101',
    '$2y$10$ojUcCIAGOsz.aSZV7oh9.uuFAfGX1PWYFfjPeWpYDCo2o4l4yDW6W',
    'Liezel', 'Paciente',
    'contactenvirocool@gmail.com',
    '09486201591'
);

INSERT INTO OperationalManager (manager_username, manager_password, manager_fname, manager_lname, manager_email, manager_phone)
VALUES (
    'opsmanager101',
    '$2y$10$GP4KbAkZKmnppOx5Z9Fuq.bRyZ84iB1YHrCAXnwnfosam1TaM9ffO',
    'Carlos', 'Reyes',
    'pacienteliezel04@gmail.com',
    '09171234567'
);

INSERT INTO Transactions (customer_name, customer_address, customer_contact, date_of_order, mode_of_payment, down_payment, balance, total)
VALUES 
('John Doe', '123 Main St', '09123456789', CURDATE(), 'Cash', 500, 1500, 2000),
('Jane Smith', '456 Oak St', '09234567890', CURDATE(), 'Card', 1000, 2500, 3500),
('Alice Brown', '789 Pine St', '09345678901', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'COD', 750, 1250, 2000);

INSERT INTO PurchaseOrder (transaction_id, quantity, description, unit_cost)
VALUES
(100001, 1, 'Eco Bottle', 200.00),
(100002, 2, 'Reusable Bag', 150.00),
(100003, 1, 'Solar Lamp', 500.00);

INSERT INTO DeliverySummary (summary_date, summary_month, successful_deliveries, failed_deliveries, customer_reviews_count, avg_rating, reason_customer_didnt_receive, reason_damaged_item)
VALUES 
(CURDATE(), DATE_FORMAT(CURDATE(), '%Y-%m'), 10, 2, 5, 4.5, 1, 1),
(DATE_SUB(CURDATE(), INTERVAL 1 DAY), DATE_FORMAT(CURDATE(), '%Y-%m'), 8, 3, 4, 4.2, 2, 0);

INSERT INTO TopSellingItems (month, item_name, quantity_sold)
VALUES 
(DATE_FORMAT(CURDATE(), '%Y-%m'), 'Reusable Bamboo Straw Set', 320),
(DATE_FORMAT(CURDATE(), '%Y-%m'), 'Eco-Friendly Tote Bag', 275);


UPDATE Transactions SET status='Delivered', customer_rating=5.0 WHERE transaction_id=100001;
UPDATE Transactions SET status='Cancelled', cancel_reason='Customer didn''t receive' WHERE transaction_id=100002;
UPDATE Transactions SET status='Delivered', customer_rating=4.0 WHERE transaction_id=100003;


SELECT * FROM Admin;
SELECT * FROM OperationalManager;
SELECT * FROM DeliveryPersonnel;
SELECT * FROM Transactions;
SELECT * FROM PurchaseOrder;
SELECT * FROM DeliveryAssignments;
SELECT * FROM DeliverySummary;

SELECT pers_username, pers_fname, pers_lname, status, assignment_status
FROM DeliveryPersonnel;

SELECT ad_username, ad_password FROM Admin;

DESCRIBE Transactions;

SELECT * FROM DeliveryAssignments 
WHERE personnel_username = 'personnel02';

------------- CREDENTIALS -----------------
Admin Credentials:
Username: admin101
Password: admin111219#

Operational Manager Credentials:
Username: opsmanager101
Password: Manager1111219#

HASH PASSWORDS:
ADMIN: $2y$10$ojUcCIAGOsz.aSZV7oh9.uuFAfGX1PWYFfjPeWpYDCo2o4l4yDW6W
OPS: $2y$10$GP4KbAkZKmnppOx5Z9Fuq.bRyZ84iB1YHrCAXnwnfosam1TaM9ffO  
Delivery Personnel: Based on their birthdays like (2002-04-29)
