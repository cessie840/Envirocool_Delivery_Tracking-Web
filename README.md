The purpose of this repository is to manage the version history for the development of our capstone project named "Web-Based Delivery Tracking with Data Analytics"



-------------------------------------------------------------------------------------------------------------------------------------------------------------------


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
    login_attempts INT DEFAULT 0,
	last_attempt DATETIME NULL,
    lock_until DATETIME DEFAULT NULL,
    is_locked TINYINT(1) DEFAULT 0
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
    login_attempts INT DEFAULT 0,
	last_attempt DATETIME NULL,
    is_locked TINYINT(1) DEFAULT 0,
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
    assignment_status ENUM('Available', 'Out For Delivery') DEFAULT 'Available',
    assigned_transaction_id INT DEFAULT NULL,
    pers_resetToken VARCHAR(100),
    reset_expire DATETIME,
    reset_requested_at DATETIME,
    pers_profile_pic VARCHAR(255) DEFAULT 'default-profile-pic.png',
    pers_email VARCHAR(255),
    attempts INT DEFAULT 0,
    login_attempts INT DEFAULT 0,
	last_attempt DATETIME NULL,
    is_locked TINYINT(1) DEFAULT 0,
    lock_until DATETIME DEFAULT NULL
	
);

CREATE TABLE Transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255),
    customer_address TEXT,
    latitude DOUBLE DEFAULT 0,
    longitude DOUBLE DEFAULT 0,
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
	proof_of_payment TEXT,
	 payment_status ENUM('Fully Paid', 'Partially Paid'),
    tracking_number VARCHAR(20),
    status ENUM('Pending', 'To Ship', 'Out for Delivery', 'Delivered', 'Cancelled') DEFAULT 'Pending',
    completed_at DATETIME NULL,
    proof_of_delivery VARCHAR(255) NULL,
    assigned_device_id VARCHAR(50) DEFAULT NULL,
    shipout_at DATETIME NULL,
    cancelled_reason TEXT NULL,
    cancelled_at DATETIME NULL,
    rescheduled_date DATE NULL,
    customer_rating DECIMAL(3,1) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    customer_feedback VARCHAR(500) NULL
) AUTO_INCREMENT = 4001;




CREATE TABLE Product (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    type_of_product VARCHAR(255) NOT NULL,
    description VARCHAR(255) NOT NULL,
    unit_cost DECIMAL(10,2) NULL,
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
    device_id VARCHAR(50) NULL,
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

CREATE TABLE location (
city_id INT AUTO_INCREMENT PRIMARY KEY,
province_name VARCHAR(50),
city_name VARCHAR (50),
barangay_name varchar (50)
);


select*from DeliveryPersonnel;
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

INSERT INTO Product (type_of_product, description, unit_cost) 
VALUES 
("SPEED FAN ", "HIGH VOLUME 4.9M", NULL),
("SPEED FAN ", "HIGH VOLUME 7.3M", NULL),
("SPEED FAN ", "LOW VOLUME 4.9M", NULL),
("SPEED FAN ", "LOW VOLUME 7.3M", NULL),
("AIRCON", "WINDOW TYPE 1.0HP", NULL),
("AIRCON", "WINDOW TYPE 1.5HP", NULL),
("AIRCON", "WINDOW TYPE 2.0HP", NULL),
("AIRCON", "WINDOW TYPE 2.5HP", NULL),
("AIRCON", "WINDOW TYPE 3.0HP", NULL),
("AIRCON", "HIGHWALL 1.0HP", NULL),
("AIRCON", "HIGHWALL TYPE 1.5HP", NULL),
("AIRCON", "HIGHWALL TYPE 2.0HP", NULL),
("AIRCON", "HIGHWALL TYPE 2.5HP", NULL),
("AIRCON", "HIGHWALL TYPE 3.0HP", NULL),
("AIRCON", "CASETTE TYPE 3TR", NULL),
("AIRCON", "CASETTE TYPE 5TR", NULL),
("AIRCON", "UNDERCEILING TYPE 3TR",NULL),
("AIRCON", "UNDERCEILING TYPE 5TR", NULL),
("AIRCON", "FLOOR MOUNTED TYPE 3TR", NULL),
("AIRCON", "FLOOR MOUNTED TYPE 5TR", NULL);


INSERT INTO gps_coordinates (device_id, lat, lng, recorded_at) VALUES
--  ('DEVICE_01', 14.2091835, 121.1368418, NOW() );            
-- ('DEVICE_01', 14.2092500, 121.1369000, NOW() ); 
('DEVICE_01', 14.2093100, 121.1369700, NOW() + INTERVAL 2 MINUTE), 
('DEVICE_01', 14.2093700, 121.1370500, NOW() + INTERVAL 3 MINUTE),
('DEVICE_01', 14.2094200, 121.1371200, NOW() + INTERVAL 4 MINUTE), 
('DEVICE_01', 14.2095000, 121.1372500, NOW() + INTERVAL 5 MINUTE);
-- ('DEVICE_01', 14.2096000, 121.1374000, NOW() + INTERVAL 6 MINUTE),
-- ('DEVICE_01', 14.2097000, 121.1375500, NOW() + INTERVAL 7 MINUTE),
-- ('DEVICE_01', 14.2098000, 121.1377000, NOW() + INTERVAL 8 MINUTE),
-- ('DEVICE_01', 14.2099000, 121.1378500, NOW() + INTERVAL 9 MINUTE);
-- ('DEVICE_01', 14.2100000, 121.1380000, NOW() + INTERVAL 10 MINUTE)
-- ('DEVICE_01', 14.2101000, 121.1381500, NOW() + INTERVAL 11 MINUTE),
-- ('DEVICE_01', 14.2102000, 121.1383000, NOW() + INTERVAL 12 MINUTE),
-- ('DEVICE_01', 14.2103000, 121.1384500, NOW() + INTERVAL 13 MINUTE),
-- ('DEVICE_01', 14.2104000, 121.1386000, NOW() + INTERVAL 14 MINUTE),
-- ('DEVICE_01', 14.2676956, 121.1112068, NOW() + INTERVAL 15 MINUTE);

-- ('DEVICE_01', 14.2676156, 121.1112100, NOW()),
-- ('DEVICE_01', 14.2790196, 121.14540180524608, NOW());
-- ('DEVICE_01', 14.2754855, 121.1446400, NOW()+ INTERVAL 5 MINUTE),
-- ('DEVICE_01', 14.2742996, 121.1475564, NOW()+ INTERVAL 5 MINUTE);

INSERT INTO location (province_name, city_name, barangay_name) VALUES
-- Santa Rosa
('Laguna', 'Santa Rosa', 'Aplaya'),
('Laguna', 'Santa Rosa', 'Balibago'),
('Laguna', 'Santa Rosa', 'Caingin'),
('Laguna', 'Santa Rosa', 'Dila'),
('Laguna', 'Santa Rosa', 'Dita'),
('Laguna', 'Santa Rosa', 'Don Jose'),
('Laguna', 'Santa Rosa', 'Ibaba'),
('Laguna', 'Santa Rosa', 'Kanluran'),
('Laguna', 'Santa Rosa', 'Labas'),
('Laguna', 'Santa Rosa', 'Macabling'),
('Laguna', 'Santa Rosa', 'Malitlit'),
('Laguna', 'Santa Rosa', 'Malusak'),
('Laguna', 'Santa Rosa', 'Market'),
('Laguna', 'Santa Rosa', 'Pooc'),
('Laguna', 'Santa Rosa', 'Pulong Santa Cruz'),
('Laguna', 'Santa Rosa', 'Sinalhan'),
('Laguna', 'Santa Rosa', 'Sto Domingo'),
('Laguna', 'Santa Rosa', 'Tagapo'),

-- Calamba
('Laguna', 'Calamba', 'Bagong Kalsada'),
('Laguna', 'Calamba', 'Banadero'),
('Laguna', 'Calamba', 'Banlic'),
('Laguna', 'Calamba', 'Barandal'),
('Laguna', 'Calamba', 'Barangay 1 (Poblacion 1)'),
('Laguna', 'Calamba', 'Barangay 2 (Poblacion 2)'),
('Laguna', 'Calamba', 'Barangay 3 (Poblacion 3)'),
('Laguna', 'Calamba', 'Barangay 4 (Poblacion 4)'),
('Laguna', 'Calamba', 'Barangay 5 (Poblacion 5)'),
('Laguna', 'Calamba', 'Barangay 6 (Poblacion 6)'),
('Laguna', 'Calamba', 'Barangay 7 (Poblacion 7)'),
('Laguna', 'Calamba', 'Batino'),
('Laguna', 'Calamba', 'Bubuyan'),
('Laguna', 'Calamba', 'Bucal'),
('Laguna', 'Calamba', 'Bunggo'),
('Laguna', 'Calamba', 'Burol'),
('Laguna', 'Calamba', 'Camaligan'),
('Laguna', 'Calamba', 'Canlubang'),
('Laguna', 'Calamba', 'Halang'),
('Laguna', 'Calamba', 'Hornalan'),
('Laguna', 'Calamba', 'Kay-Anlog'),
('Laguna', 'Calamba', 'Laguerta'),
('Laguna', 'Calamba', 'La Mesa'),
('Laguna', 'Calamba', 'Lawa'),
('Laguna', 'Calamba', 'Lecheria'),
('Laguna', 'Calamba', 'Lingga'),
('Laguna', 'Calamba', 'Looc'),
('Laguna', 'Calamba', 'Mabato'),
('Laguna', 'Calamba', 'Majada Labas'),
('Laguna', 'Calamba', 'Makiling'),
('Laguna', 'Calamba', 'Mapagong'),
('Laguna', 'Calamba', 'Masili'),
('Laguna', 'Calamba', 'Maunong'),
('Laguna', 'Calamba', 'Mayapa'),
('Laguna', 'Calamba', 'Milagrosa (Tulo)'),
('Laguna', 'Calamba', 'Paciano Rizal'),
('Laguna', 'Calamba', 'Palingon'),
('Laguna', 'Calamba', 'Palo-Alto'),
('Laguna', 'Calamba', 'Pansol'),
('Laguna', 'Calamba', 'Parian'),
('Laguna', 'Calamba', 'Prinza'),
('Laguna', 'Calamba', 'Punta'),
('Laguna', 'Calamba', 'Puting Lupa'),
('Laguna', 'Calamba', 'Real'),
('Laguna', 'Calamba', 'Saimsim'),
('Laguna', 'Calamba', 'Sampiruhan'),
('Laguna', 'Calamba', 'San Cristobal'),
('Laguna', 'Calamba', 'San Jose'),
('Laguna', 'Calamba', 'San Juan'),
('Laguna', 'Calamba', 'Sirang Lupa'),
('Laguna', 'Calamba', 'Sucol'),
('Laguna', 'Calamba', 'Turbina'),
('Laguna', 'Calamba', 'Ulango'),
('Laguna', 'Calamba', 'Uwisan'),

-- Cabuyao
('Laguna', 'Cabuyao', 'Baclaran'),
('Laguna', 'Cabuyao', 'Banaybanay'),
('Laguna', 'Cabuyao', 'Banlic'),
('Laguna', 'Cabuyao', 'Barangay Dos'),
('Laguna', 'Cabuyao', 'Barangay Tres'),
('Laguna', 'Cabuyao', 'Barangay Uno'),
('Laguna', 'Cabuyao', 'Bigaa'),
('Laguna', 'Cabuyao', 'Butong'),
('Laguna', 'Cabuyao', 'Casile'),
('Laguna', 'Cabuyao', 'Diezmo'),
('Laguna', 'Cabuyao', 'Gulod'),
('Laguna', 'Cabuyao', 'Mamatid'),
('Laguna', 'Cabuyao', 'Marinig'),
('Laguna', 'Cabuyao', 'Niugan'),
('Laguna', 'Cabuyao', 'Pittland'),
('Laguna', 'Cabuyao', 'Pulo'),
('Laguna', 'Cabuyao', 'Sala'),
('Laguna', 'Cabuyao', 'San Isidro'),

-- San Pedro
('Laguna', 'San Pedro', 'Bagong Silang'),
('Laguna', 'San Pedro', 'Calendola'),
('Laguna', 'San Pedro', 'Chrysanthemum'),
('Laguna', 'San Pedro', 'Cuyab'),
('Laguna', 'San Pedro', 'Estrella'),
('Laguna', 'San Pedro', 'Fatima'),
('Laguna', 'San Pedro', 'G.S.I.S.'),
('Laguna', 'San Pedro', 'Landayan'),
('Laguna', 'San Pedro', 'Langgam'),
('Laguna', 'San Pedro', 'Laram'),
('Laguna', 'San Pedro', 'Magsaysay'),
('Laguna', 'San Pedro', 'Maharlika'),
('Laguna', 'San Pedro', 'Narra'),
('Laguna', 'San Pedro', 'Nueva'),
('Laguna', 'San Pedro', 'Pacita 1'),
('Laguna', 'San Pedro', 'Pacita 2'),
('Laguna', 'San Pedro', 'Poblacion'),
('Laguna', 'San Pedro', 'Riverside'),
('Laguna', 'San Pedro', 'Rosario'),
('Laguna', 'San Pedro', 'Sampaguita Village'),
('Laguna', 'San Pedro', 'San Antonio'),
('Laguna', 'San Pedro', 'San Lorenzo Ruiz'),
('Laguna', 'San Pedro', 'San Roque'),
('Laguna', 'San Pedro', 'Santo Niño'),
('Laguna', 'San Pedro', 'San Vicente'),
('Laguna', 'San Pedro', 'United Bayanihan'),
('Laguna', 'San Pedro', 'United Better Living'),

-- Biñan
('Laguna', 'Biñan', 'Bagong Silang'),
('Laguna', 'Biñan', 'Banlic'),
('Laguna', 'Biñan', 'Langgam'),
('Laguna', 'Biñan', 'Malamig'),
('Laguna', 'Biñan', 'Niugan'),
('Laguna', 'Biñan', 'San Antonio'),
('Laguna', 'Biñan', 'San Cristobal'),
('Laguna', 'Biñan', 'San Isidro'),
('Laguna', 'Biñan', 'Sto. Niño'),
('Laguna', 'Biñan', 'Tabing Ilog'),

-- Los Baños
('Laguna', 'Los Baños', 'Bagong Silang'),
('Laguna', 'Los Baños', 'Baybayin'),
('Laguna', 'Los Baños', 'Bucal'),
('Laguna', 'Los Baños', 'Canlubang'),
('Laguna', 'Los Baños', 'Bayog'),
('Laguna', 'Los Baños', 'Maahas'),
('Laguna', 'Los Baños', 'Timugan'),
('Laguna', 'Los Baños', 'Putho-Tuntungin'),

-- Calauan
('Laguna', 'Calauan', 'Bagumbayan'),
('Laguna', 'Calauan', 'Caloocan'),
('Laguna', 'Calauan', 'Malabanan'),
('Laguna', 'Calauan', 'San Juan'),
('Laguna', 'Calauan', 'San Antonio'),
('Laguna', 'Calauan', 'Santo Niño'),
('Laguna', 'Calauan', 'Mayamot');



-- CREDENTIALS

-- Admin Credentials:
    -- Username: admin101
    -- Password: admin111219#       

-- Operational Manager Credentials:

    -- Username: opsmanager101
    -- Password: Manager1111219#


-- HASH PASSWORDS:

-- ADMIN: $2y$10$ojUcCIAGOsz.aSZV7oh9.uuFAfGX1PWYFfjPeWpYDCo2o4l4yDW6W 
-- OPS: $2y$10$GP4KbAkZKmnppOx5Z9Fuq.bRyZ84iB1YHrCAXnwnfosam1TaM9ffO
-- Delivery Personnel: Based on their birthdays like (2002-04-29)


SELECT * FROM Admin;
SELECT * FROM OperationalManager;
SELECT * FROM DeliveryPersonnel;
SELECT * FROM Transactions;
SELECT * FROM PurchaseOrder;
SELECT * FROM DeliveryAssignments;
SELECT * FROM DeliverySummary;
