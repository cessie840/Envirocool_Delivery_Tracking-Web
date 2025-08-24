import React, { useEffect, useState } from "react";
import { Modal, Button, Image } from "react-bootstrap";
import axios from "axios";

const ViewPersonnelModal = ({ show, onHide, username }) => {
  const [profile, setProfile] = useState({
    Name: "",
    username: "",
    Email: "",
    Contact: "",
    profilePic: "",
    Age: "",
    Gender: "",
    Birthdate: "",
    Status: "",
  });

  useEffect(() => {
    if (show && username) {
      axios
        .post(
          "http://localhost/DeliveryTrackingSystem/get_personnel_details.php",
          { pers_username: username }
        )
        .then((res) => {
          if (res.data.success) {
            const u = res.data.user;
            setProfile({
              Name: `${u.pers_fname} ${u.pers_lname}`,
              username: u.pers_username,
              Email: u.pers_email,
              Contact: u.pers_phone,
              profilePic: u.pers_profile_pic, 
              Age: u.pers_age,
              Gender: u.pers_gender,
              Birthdate: u.pers_birth,
              Status: u.status,
            });
          }
        })
        .catch((err) => console.error(err));
    }
  }, [show, username]);

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton style={{ backgroundColor: "#E8F8F5" }}>
        <Modal.Title>Personnel Details</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ backgroundColor: "#F2FDF4" }}>
        <div className="text-center mb-3">
          <div
            className="mx-auto rounded-circle overflow-hidden border border-3 d-flex justify-content-center align-items-center"
            style={{
              width: "120px",
              height: "120px",
              backgroundColor: "#dee2e6",
              border: "2px solid #116B8A",
            }}
          >
            <Image
              src={
                profile.profilePic ||
                "http://localhost/DeliveryTrackingSystem/uploads/default-profile-pic.png"
              }
              onError={(e) =>
                (e.target.src =
                  "http://localhost/DeliveryTrackingSystem/uploads/default-profile-pic.png")
              }
              alt="Profile"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
          <h5 className="fw-bold mt-3 mb-1" style={{ color: "#116B8A" }}>
            {profile.Name || "Full Name"}
          </h5>
          <p className="text-muted mb-1" style={{ fontSize: "0.9rem" }}>
            ID: {profile.username || "User ID"}
          </p>
        </div>

        <div>
          <p>
            <strong>Email:</strong> {profile.Email}
          </p>
          <p>
            <strong>Contact:</strong> {profile.Contact}
          </p>
          <p>
            <strong>Age:</strong> {profile.Age}
          </p>
          <p>
            <strong>Gender:</strong> {profile.Gender}
          </p>
          <p>
            <strong>Birthdate:</strong> {profile.Birthdate}
          </p>
          <p>
            <strong>Status:</strong> {profile.Status}
          </p>
        </div>
      </Modal.Body>
      <Modal.Footer style={{ backgroundColor: "#E8F8F5" }}>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ViewPersonnelModal;
