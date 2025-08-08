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
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) AUTO_INCREMENT = 100001;

CREATE TABLE PurchaseOrder(
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
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
FOREIGN KEY (transaction_id) REFERENCES Transactions(transaction_id) ON DELETE CASCADE,
FOREIGN KEY (po_id) REFERENCES PurchaseOrder(po_id) ON DELETE CASCADE
);

INSERT INTO Admin (
ad_username, ad_password, ad_fname, ad_lname, ad_email, ad_phone,
ad_resetToken, reset_expire, reset_requested_at,
attempts, lock_until
) VALUES (
'admin101',
'$2y$10$ojUcCIAGOsz.aSZV7oh9.uuFAfGX1PWYFfjPeWpYDCo2o4l4yDW6W',
'Liezel',
'Paciente',
'contactenvirocool@gmail.com',
'09486201591',
NULL, NULL, NULL,
0, NULL
);

INSERT INTO OperationalManager (
manager_username, manager_password, manager_fname, manager_lname,
manager_email, manager_phone,
manager_resetToken, reset_expire, reset_requested_at,
attempts, lock_until
) VALUES (
'opsmanager101',
'$2y$10$GP4KbAkZKmnppOx5Z9Fuq.bRyZ84iB1YHrCAXnwnfosam1TaM9ffO',
'Carlos',
'Reyes',
'pacienteliezel04@gmail.com',
'09171234567',
NULL, NULL, NULL,
0, NULL
);

INSERT INTO Transactions (customer_name, customer_address, customer_contact, date_of_order, mode_of_payment, down_payment, balance, total)
VALUES
('John Doe', '123 Main St, Cityville', '09123456789', '2025-06-16', 'Cash', 500.00, 1500.00, 2000.00),
('Jane Smith', '456 Oak St, Townsville', '09234567890', '2025-06-17', 'Card', 1000.00, 2500.00, 3500.00),
('Alice Brown', '789 Pine St, Villagetown', '09345678901', '2025-06-18', 'COD', 750.00, 1250.00, 2000.00);

INSERT INTO PurchaseOrder (transaction_id, quantity, description, unit_cost)
VALUES
(100001, 7, 'USB-C Docking Station - Anker PowerExpand', 69.99),

(100002, 3, 'Wireless Mouse - Logitech MX Master 3', 99.99),
(100002, 2, 'Bluetooth Headphones - Sony WH-1000XM4', 299.99),
(100002, 4, 'External SSD - Samsung T7 1TB', 120.00),

(100003, 5, 'Laptop - Dell XPS 15', 1200.50),
(100003, 6, 'Mechanical Keyboard - Keychron K6', 85.75),
(100003, 2, 'Ergonomic Office Chair - Herman Miller Aeron', 999.00);

SELECT _ FROM Admin;
SELECT _ FROM OperationalManager;
SELECT _ FROM DeliveryPersonnel;
SELECT _ FROM Transactions;
SELECT _ FROM PurchaseOrder;
SELECT _ FROM DeliveryAssignments;

SELECT pers_username, pers_fname, pers_lname, status, assignment_status
FROM DeliveryPersonnel;

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
