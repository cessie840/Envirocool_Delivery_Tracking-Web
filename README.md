# Envirocool_Delivery-Tracking-Web
The purpose of this repository is to manage the version history for the development of our capstone project named "Web-Based Delivery Tracking with Data Analytics"
-------------------------------------------------------------------------------------------------------------------------------------------------------------------

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
    target_date_delivery DATE,
    mode_of_payment VARCHAR(255),
    payment_option ENUM('Full Payment', 'Down Payment'),
    full_payment DECIMAL(10,2),
    fbilling_date DATE,
    dbilling_date DATE,
    down_payment DECIMAL(10,2),
    balance DECIMAL(10,2),
    total DECIMAL(10,2),
    tracking_number VARCHAR(20),
    status ENUM('Pending', 'To Ship', 'Out for Delivery', 'Delivered', 'Cancelled') DEFAULT 'Pending',
    completed_at DATETIME NULL,
    shipout_at DATETIME NULL,
    cancelled_reason TEXT NULL,
    cancelled_at DATETIME NULL,
    rescheduled_date DATE NULL,
    customer_rating DECIMAL(3,1) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) AUTO_INCREMENT = 4001;


CREATE TABLE Product (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    type_of_product VARCHAR(255) NOT NULL,
    description VARCHAR(255) NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(type_of_product, description)
);

CREATE TABLE PurchaseOrder (
    po_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    product_id INT NULL,
    type_of_product VARCHAR(255) NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    FOREIGN KEY (transaction_id) REFERENCES Transactions(transaction_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Product(product_id) ON DELETE CASCADE
) AUTO_INCREMENT = 1;

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
    delivery_status ENUM('Pending', 'To Ship', 'Out for Delivery', 'Delivered', 'Cancelled') DEFAULT 'Pending',
    cancellation_reason TEXT NULL,
    cancelled_at DATETIME NULL,
    status ENUM('OutForDelivery', 'Delivered', 'Cancelled') DEFAULT 'OutForDelivery',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES Transactions(transaction_id) ON DELETE CASCADE,
    FOREIGN KEY (po_id) REFERENCES PurchaseOrder(po_id) ON DELETE CASCADE
);

CREATE TABLE gps_coordinates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    lat DOUBLE NOT NULL,
    lng DOUBLE NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE current_positions (
    device_id VARCHAR(50) PRIMARY KEY,
    lat DOUBLE,
    lng DOUBLE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE DeliverySummary (
    summary_id INT AUTO_INCREMENT PRIMARY KEY,
    summary_date DATE,
    summary_month VARCHAR(7),
    successful_deliveries INT DEFAULT 0,
    failed_deliveries INT DEFAULT 0,
    customer_reviews_count INT DEFAULT 0,
    avg_rating DECIMAL(3,2) DEFAULT 0,
    location_reason INT DEFAULT 0,
    vehicle_reason INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE TopSellingItems (
    top_item_id INT AUTO_INCREMENT PRIMARY KEY,
    month VARCHAR(7),
    item_name VARCHAR(255),
    quantity_sold INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE DeliveryHistory (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    event_type ENUM('Cancelled', 'Rescheduled', 'Delivered') NOT NULL,
    reason TEXT NULL,
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES Transactions(transaction_id) ON DELETE CASCADE
);


INSERT INTO Admin (ad_username, ad_password, ad_fname, ad_lname, ad_email, ad_phone) 
VALUES (
    'admin101',
    '$2y$10$ojUcCIAGOsz.aSZV7oh9.uuFAfGX1PWYFfjPeWpYDCo2o4l4yDW6W',
    'Liezel',
    'Paciente',
    'contactenvirocool@gmail.com',
    '09486201591'
);

INSERT INTO OperationalManager (manager_username, manager_password, manager_fname, manager_lname, manager_email, manager_phone) 
VALUES (
    'opsmanager101',
    '$2y$10$GP4KbAkZKmnppOx5Z9Fuq.bRyZ84iB1YHrCAXnwnfosam1TaM9ffO',
    'Carlos',
    'Reyes',
    'pacienteliezel04@gmail.com',
    '09171234567'
);

ALTER TABLE DeliveryPersonnel
MODIFY assignment_status ENUM('Available', 'Out For Delivery') DEFAULT 'Available';

-- CREDENTIALS
-- Admin Credentials:
--        Username: admin101
--        Password: admin111219#
--        
-- Operational Manager Credentials:
--          Username: opsmanager101
--          Password: Manager1111219#

-- HASH PASSWORDS:
-- 	   ADMIN: $2y$10$ojUcCIAGOsz.aSZV7oh9.uuFAfGX1PWYFfjPeWpYDCo2o4l4yDW6W 
--        OPS: $2y$10$GP4KbAkZKmnppOx5Z9Fuq.bRyZ84iB1YHrCAXnwnfosam1TaM9ffO
-- 	   Delivery Personnel: Based on their birthdays like (2002-04-29)
       
       
SELECT * FROM Admin;
SELECT * FROM OperationalManager;
SELECT * FROM DeliveryPersonnel;
SELECT * FROM Transactions;
SELECT * FROM PurchaseOrder;
SELECT * FROM DeliveryAssignments;
SELECT * FROM DeliverySummary;
