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
    proof_of_delivery VARCHAR(255) NULL,
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

ALTER TABLE DeliveryAssignments
ADD COLUMN notified TINYINT(1) DEFAULT 0;

select*from transactions;
select*from DeliveryPersonnel;
select*from Product;

select*from DeliveryAssignments;
ALTER TABLE Product MODIFY unit_cost DECIMAL(10,2) NULL;


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
ALTER TABLE DeliveryAssignments
ADD COLUMN device_id VARCHAR(50) NULL AFTER personnel_username;

select*from transactions;
select*from deliveryassignments;

-- Assuming table already exists:
-- CREATE TABLE gps_coordinates (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     device_id VARCHAR(50) NOT NULL,
--     lat DOUBLE NOT NULL,
--     lng DOUBLE NOT NULL,
--     recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- INSERT INTO gps_coordinates (device_id, lat, lng, recorded_at) VALUES
-- -- ('DEVICE_01', 14.2091835, 121.1368418, NOW() ),                    
-- ('DEVICE_01', 14.2092500, 121.1369000, NOW() + INTERVAL 1 MINUTE), 
-- ('DEVICE_01', 14.2093100, 121.1369700, NOW() + INTERVAL 2 MINUTE), 
-- ('DEVICE_01', 14.2093700, 121.1370500, NOW() + INTERVAL 3 MINUTE), 
-- ('DEVICE_01', 14.2094200, 121.1371200, NOW() + INTERVAL 4 MINUTE), 
-- ('DEVICE_01', 14.2095000, 121.1372500, NOW() + INTERVAL 5 MINUTE),
-- ('DEVICE_01', 14.2096000, 121.1374000, NOW() + INTERVAL 6 MINUTE),
-- ('DEVICE_01', 14.2097000, 121.1375500, NOW() + INTERVAL 7 MINUTE),
-- ('DEVICE_01', 14.2098000, 121.1377000, NOW() + INTERVAL 8 MINUTE),
-- ('DEVICE_01', 14.2099000, 121.1378500, NOW() + INTERVAL 9 MINUTE),
-- ('DEVICE_01', 14.2100000, 121.1380000, NOW() + INTERVAL 10 MINUTE),
-- ('DEVICE_01', 14.2101000, 121.1381500, NOW() + INTERVAL 11 MINUTE),
-- ('DEVICE_01', 14.2102000, 121.1383000, NOW() + INTERVAL 12 MINUTE),
-- ('DEVICE_01', 14.2103000, 121.1384500, NOW() + INTERVAL 13 MINUTE),
-- ('DEVICE_01', 14.2104000, 121.1386000, NOW() + INTERVAL 14 MINUTE),
-- ('DEVICE_01', 14.2676956, 121.1112068, NOW() + INTERVAL 15 MINUTE);

ALTER TABLE Transactions
ADD COLUMN assigned_device_id VARCHAR(50) DEFAULT NULL;


ALTER TABLE Transactions
ADD COLUMN latitude DOUBLE DEFAULT 0,
ADD COLUMN longitude DOUBLE DEFAULT 0;


CREATE TABLE laguna (
city_id INT AUTO_INCREMENT PRIMARY KEY,
city_name VARCHAR (50),
barangay_name varchar (50)
);

INSERT INTO laguna (city_name, barangay_name) VALUES
-- Santa Rosa
('Santa Rosa', 'Aplaya'),
('Santa Rosa', 'Balibago'),
('Santa Rosa', 'Caingin'),
('Santa Rosa', 'Dila'),
('Santa Rosa', 'Dita'),
('Santa Rosa', 'Don Jose'),
('Santa Rosa', 'Ibaba'),
('Santa Rosa', 'Kanluran'),
('Santa Rosa', 'Labas'),
('Santa Rosa', 'Macabling'),
('Santa Rosa', 'Malitlit'),
('Santa Rosa', 'Malusak'),
('Santa Rosa', 'Market'),
('Santa Rosa', 'Pooc'),
('Santa Rosa', 'Pulong Santa Cruz'),
('Santa Rosa', 'Sinalhan'),
('Santa Rosa', 'Sto Domingo'),
('Santa Rosa', 'Tagapo'),

-- Calamba
('Calamba', 'Bagong Kalsada'),
('Calamba', 'Banadero'),
('Calamba', 'Banlic'),
('Calamba', 'Barandal'),
('Calamba', 'Barangay 1 (Poblacion 1)'),
('Calamba', 'Barangay 2 (Poblacion 2)'),
('Calamba', 'Barangay 3 (Poblacion 3)'),
('Calamba', 'Barangay 4 (Poblacion 4)'),
('Calamba', 'Barangay 5 (Poblacion 5)'),
('Calamba', 'Barangay 6 (Poblacion 6)'),
('Calamba', 'Barangay 7 (Poblacion 7)'),
('Calamba', 'Batino'),
('Calamba', 'Bubuyan'),
('Calamba', 'Bucal'),
('Calamba', 'Bunggo'),
('Calamba', 'Burol'),
('Calamba', 'Camaligan'),
('Calamba', 'Canlubang'),
('Calamba', 'Halang'),
('Calamba', 'Hornalan'),
('Calamba', 'Kay-Anlog'),
('Calamba', 'Laguerta'),
('Calamba', 'La Mesa'),
('Calamba', 'Lawa'),
('Calamba', 'Lecheria'),
('Calamba', 'Lingga'),
('Calamba', 'Looc'),
('Calamba', 'Mabato'),
('Calamba', 'Majada Labas'),
('Calamba', 'Makiling'),
('Calamba', 'Mapagong'),
('Calamba', 'Masili'),
('Calamba', 'Maunong'),
('Calamba', 'Mayapa'),
('Calamba', 'Milagrosa (Tulo)'),
('Calamba', 'Paciano Rizal'),
('Calamba', 'Palingon'),
('Calamba', 'Palo-Alto'),
('Calamba', 'Pansol'),
('Calamba', 'Parian'),
('Calamba', 'Prinza'),
('Calamba', 'Punta'),
('Calamba', 'Puting Lupa'),
('Calamba', 'Real'),
('Calamba', 'Saimsim'),
('Calamba', 'Sampiruhan'),
('Calamba', 'San Cristobal'),
('Calamba', 'San Jose'),
('Calamba', 'San Juan'),
('Calamba', 'Sirang Lupa'),
('Calamba', 'Sucol'),
('Calamba', 'Turbina'),
('Calamba', 'Ulango'),
('Calamba', 'Uwisan'),

-- Cabuyao
('Cabuyao', 'Baclaran'),
('Cabuyao', 'Banaybanay'),
('Cabuyao', 'Banlic'),
('Cabuyao', 'Barangay Dos'),
('Cabuyao', 'Barangay Tres'),
('Cabuyao', 'Barangay Uno'),
('Cabuyao', 'Bigaa'),
('Cabuyao', 'Butong'),
('Cabuyao', 'Casile'),
('Cabuyao', 'Diezmo'),
('Cabuyao', 'Gulod'),
('Cabuyao', 'Mamatid'),
('Cabuyao', 'Marinig'),
('Cabuyao', 'Niugan'),
('Cabuyao', 'Pittland'),
('Cabuyao', 'Pulo'),
('Cabuyao', 'Sala'),
('Cabuyao', 'San Isidro'),

-- San Pedro
('San Pedro', 'Bagong Silang'),
('San Pedro', 'Calendola'),
('San Pedro', 'Chrysanthemum'),
('San Pedro', 'Cuyab'),
('San Pedro', 'Estrella'),
('San Pedro', 'Fatima'),
('San Pedro', 'G.S.I.S.'),
('San Pedro', 'Landayan'),
('San Pedro', 'Langgam'),
('San Pedro', 'Laram'),
('San Pedro', 'Magsaysay'),
('San Pedro', 'Maharlika'),
('San Pedro', 'Narra'),
('San Pedro', 'Nueva'),
('San Pedro', 'Pacita 1'),
('San Pedro', 'Pacita 2'),
('San Pedro', 'Poblacion'),
('San Pedro', 'Riverside'),
('San Pedro', 'Rosario'),
('San Pedro', 'Sampaguita Village'),
('San Pedro', 'San Antonio'),
('San Pedro', 'San Lorenzo Ruiz'),
('San Pedro', 'San Roque'),
('San Pedro', 'Santo Niño'),
('San Pedro', 'San Vicente'),
('San Pedro', 'United Bayanihan'),
('San Pedro', 'United Better Living'),

-- Biñan
('Biñan', 'Bagong Silang'),
('Biñan', 'Banlic'),
('Biñan', 'Langgam'),
('Biñan', 'Malamig'),
('Biñan', 'Niugan'),
('Biñan', 'San Antonio'),
('Biñan', 'San Cristobal'),
('Biñan', 'San Isidro'),
('Biñan', 'Sto. Niño'),
('Biñan', 'Tabing Ilog'),

-- Los Baños
('Los Baños', 'Bagong Silang'),
('Los Baños', 'Baybayin'),
('Los Baños', 'Bucal'),
('Los Baños', 'Canlubang'),
('Los Baños', 'Bayog'),
('Los Baños', 'Maahas'),
('Los Baños', 'Timugan'),
('Los Baños', 'Putho-Tuntungin'),

-- Calauan
('Calauan', 'Bagumbayan'),
('Calauan', 'Caloocan'),
('Calauan', 'Malabanan'),
('Calauan', 'San Juan'),
('Calauan', 'San Antonio'),
('Calauan', 'Santo Niño'),
('Calauan', 'Mayamot');

