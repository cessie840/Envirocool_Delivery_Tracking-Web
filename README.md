# Envirocool_Delivery-Tracking-Web
The purpose of this repository is to manage the version history for the development of our capstone project named "Web-Based Delivery Tracking with Data Analytics"
-------------------------------------------------------------------------------------------------------------------------------------------------------------------
**DATABASE SQL**
CREATE DATABASE DeliveryTrackingSystem;
USE DeliveryTrackingSystem;

CREATE TABLE Admin(
   ad_username VARCHAR(100) PRIMARY KEY, 
   ad_password VARCHAR(100),
   ad_fname VARCHAR(100),
   ad_lname VARCHAR(100),
   ad_email VARCHAR(100),
   ad_phone VARCHAR(15)
);

CREATE TABLE OperationalManager(
  manager_username VARCHAR(100) PRIMARY KEY,
  manager_password VARCHAR(100),
  manager_fname VARCHAR(100),
  manager_lname VARCHAR(100),
  manager_email VARCHAR(100),
  manager_phone VARCHAR(15),
  manager_resetToken VARCHAR(100),
  reset_expire DATETIME,
  reset_requested_at DATETIME
);

CREATE TABLE DeliveryPersonnel(
pers_id INT PRIMARY KEY,
pers_username VARCHAR(100),
pers_password VARCHAR(100),
pers_fname VARCHAR(100),
pers_lname VARCHAR(100),
pers_age INT,
pers_gender VARCHAR(100),
pers_birth DATE,
pers_phone VARCHAR(11),
status VARCHAR(100),
pres_resetToken VARCHAR(100),
reset_expire DATETIME,
reset_requested_at DATETIME
-- pers_truck INT,
-- assigned_by VARCHAR(100),
-- FOREIGN KEY (pers_truck) REFERENCES Truck(truck_id),
-- FOREIGN KEY (assigned_by) REFERENCES OperationalManager(manager_username)
);


INSERT INTO Admin(ad_username,ad_password,ad_fname,ad_lname,ad_email,ad_phone) 
VALUES('admin101','$2y$10$tGmA6pV6iB9qdkF3g4ZpBeLzHhMSqHzJRMZHx5NnLqlPYCHp/U2vC','Liezel','Paciente','pacienteliezel04@gmail.com','09486201591');
-- "password": "admin111219#"

INSERT INTO OperationalManager (
  manager_username,
  manager_password,
  manager_fname,
  manager_lname,
  manager_email,
  manager_phone
) VALUES (
  'opsmanager101',
  '$2y$10$5jUwHh1mU7eNwZ9gIuF2oeCQi1X3Ej1eUXIppqzWfGL2Egxmh7zAy', -- hashed password
  'Carlos',
  'Reyes',
  'carlos.reyes@gmail.com',
  '09171234567'
);



UPDATE Admin
SET ad_password = '$2y$10$ojUcCIAGOsz.aSZV7oh9.uuFAfGX1PWYFfjPeWpYDCo2o4l4yDW6W'
WHERE ad_username = 'admin101';

UPDATE Admin
SET ad_email = 'contactenvirocool@gmail.com'
WHERE ad_username = 'admin101';

UPDATE DeliveryPersonnel
SET pers_email = 'killerxtreme12@gmail.com'
WHERE pers_username = 'deliverypers005';

UPDATE OperationalManager
SET manager_email = 'pacienteliezel04@gmail.com'
WHERE manager_username = 'opsmanager101';

UPDATE OperationalManager
SET manager_password = '$2y$10$GP4KbAkZKmnppOx5Z9Fuq.bRyZ84iB1YHrCAXnwnfosam1TaM9ffO'
WHERE manager_username = 'opsmanager101';

ALTER TABLE DeliveryPersonnel
CHANGE COLUMN pres_resetToken pers_resetToken VARCHAR(100);


ALTER TABLE Admin 
ADD COLUMN ad_resetToken VARCHAR(100),
ADD COLUMN reset_expire DATETIME,
ADD COLUMN reset_requested_at DATETIME;



ALTER TABLE Admin ADD COLUMN attempts INT DEFAULT 0;
ALTER TABLE OperationalManager ADD COLUMN attempts INT DEFAULT 0;
ALTER TABLE DeliveryPersonnel ADD COLUMN attempts INT DEFAULT 0;

ALTER TABLE Admin ADD COLUMN lock_until DATETIME DEFAULT NULL;
ALTER TABLE OperationalManager ADD COLUMN lock_until DATETIME DEFAULT NULL;
ALTER TABLE DeliveryPersonnel ADD COLUMN lock_until DATETIME DEFAULT NULL;
ALTER TABLE DeliveryPersonnel DROP COLUMN pers_id;

ALTER TABLE DeliveryPersonnel 
ADD COLUMN pers_profile_pic VARCHAR(255) DEFAULT 'default-profile-pic.png';

ALTER TABLE DeliveryPersonnel 
ADD COLUMN pers_email VARCHAR(255);

SELECT * FROM Admin;
SELECT * FROM OperationalManager;
SELECT * FROM DeliveryPersonnel;




Admin Credentials:
Username: admin101
Password: admin111219#

Operational Manager Credentials:
Username: opsmanager101
Password: Manager1111219#


HASH PASSWORDS:
ADMIN: $2y$10$4Hgbzve5mXF7M83xQeF1YeaBMhY9VzjeVJQCX5WPORAjMBEtZdrhK

OPS: $2y$10$ojUcCIAGOsz.aSZV7oh9.uuFAfGX1PWYFfjPeWpYDCo2o4l4yDW6W

Delivery Personnel: Based on their birthdays like (2002-04-29) 
