import React, { useState, useEffect } from "react";
import { Offcanvas, ListGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const Sidebar = ({ show, onHide }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    contact: "",
    profilePic: "",
  });

  useEffect(() => {
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
      const parsed = JSON.parse(storedProfile);

      if (parsed.name && !parsed.fullName) {
        parsed.fullName = parsed.name;
        delete parsed.name;
        localStorage.setItem("userProfile", JSON.stringify(parsed));
      }

      setProfile(parsed);
    }
  }, []);

  const handleProfileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedProfile = { ...profile, profilePic: reader.result };
        localStorage.setItem("userProfile", JSON.stringify(updatedProfile));
        setProfile(updatedProfile);
      };
      reader.readAsDataURL(file);
    }
  };

  const userName = profile.Name;
  const userId = "50021";

  return (
    <Offcanvas
      show={show}
      onHide={onHide}
      placement="start"
      backdropClassName="custom-backdrop"
      className="custom-offcanvas"
    >
      {/* OVERLAP SIDEBAR */}

      <style>
        {`
          .custom-offcanvas.offcanvas {
            z-index: 1060 !important; 
          }

          .custom-backdrop {
            z-index: 1059 !important; 
          }

          .offcanvas .btn-close {
            filter: brightness(0) invert(3);
          }
        `}
      </style>

      <Offcanvas.Header
        closeButton
        className="text-white"
        style={{ backgroundColor: "#116B8A" }}
      >
        <Offcanvas.Title>Delivery Menu</Offcanvas.Title>
      </Offcanvas.Header>

      {/* ACCOUNT DISPLAY */}
      <Offcanvas.Body className="bg-light">
        <div className="mx-2 mb-4 my-3 p-3 rounded border shadow-sm bg-white d-flex align-items-center gap-3 border-info rounded">
          <label htmlFor="profileUpload" style={{ cursor: "pointer" }}>
            <div
              className="rounded-circle overflow-hidden d-flex justify-content-center align-items-center"
              style={{
                width: "80px",
                height: "80px",
                backgroundColor: "#dee2e6",
                border: "2px solid #116B8A",
              }}
            >
              {profile.profilePic ? (
                <img
                  src={profile.profilePic}
                  alt="Profile"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <i className="bi bi-person-fill fs-3 text-secondary"></i>
              )}
              <input
                id="profileUpload"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleProfileChange}
              />
            </div>
          </label>

          {/* EDIT PROFILE */}
          <div>
            <i
              className="bi bi-pencil-square"
              style={{
                position: "absolute",
                top: "102px",
                right: "40px",
                backgroundColor: "#fff",
                padding: "3px",
                fontSize: "1.3rem",
                color: "#116B8A",
                cursor: "pointer",
              }}
              title="Edit Profile"
              onClick={() => navigate("/driver-profile-settings")}
            ></i>
            <p
              className="mb-0 fw-semibold"
              style={{ color: "black", fontSize: "1.1rem" }}
            >
              {userName}
            </p>
            <small className="text-muted">ID: {userId}</small>
          </div>
        </div>

        {/* SIDEBAR NAVIGATION */}

        <div
          className="mx-2 mb-4 p-3 border border-info rounded"
          style={{ backgroundColor: "#eaf7f7" }}
        >
          <h6 className="fw-bold mb-3 text-secondary">Navigation</h6>
          <ListGroup variant="flush">
            {[
              { name: "Assigned Delivery", path: "/driver-dashboard" },
              { name: "Out For Delivery", path: "/out-for-delivery" },
              { name: "Successful Delivered", path: "/successful-delivery" },
              { name: "Cancelled/Failed", path: "/failed-delivery" },
              { name: "Logout", path: "/" },
            ].map((item, i) => (
              <ListGroup.Item
                key={i}
                action
                style={{
                  fontSize: "1.1rem",
                  color: "#198754",
                  fontWeight: "500",
                  transition: "background-color 0.3s, color 0.3s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#e6f4f9";
                  e.currentTarget.style.color = "#0d4f65";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "";
                  e.currentTarget.style.color = "#198754";
                }}
                onClick={() => {
                  navigate(item.path);
                  onHide();
                }}
              >
                {item.name}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default Sidebar;
