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

INSERT INTO Admin(ad_username, ad_password, ad_fname, ad_lname, ad_email, ad_phone) 
VALUES (
  'admin101',
  '$2y$10$tGmA6pV6iB9qdkF3g4ZpBeLzHhMSqHzJRMZHx5NnLqlPYCHp/U2vC',
  'Liezel',
  'Paciente',
  'pacienteliezel04@gmail.com',
  '09486201591'
);

-- "password": admin111219#

UPDATE Admin
SET ad_password = '$2y$10$ojUcCIAGOsz.aSZV7oh9.uuFAfGX1PWYFfjPeWpYDCo2o4l4yDW6W'
WHERE ad_username = 'admin101';

SELECT * FROM Admin;


Admin Credentials:
Username: admin101
Password: admin111219#

Operational Manager Credentials:
Username: opsmanager101
Password: Manager1111219#


HASH PASSWORDS:
ADMIN: $2y$10$4Hgbzve5mXF7M83xQeF1YeaBMhY9VzjeVJQCX5WPORAjMBEtZdrhK

OPS: $2y$10$ojUcCIAGOsz.aSZV7oh9.uuFAfGX1PWYFfjPeWpYDCo2o4l4yDW6W