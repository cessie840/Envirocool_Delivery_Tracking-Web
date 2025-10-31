import React, { useState, useEffect } from "react";
import { Offcanvas, ListGroup, Modal, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./loading-overlay.css";
import { ToastHelper } from "./helpers/ToastHelper";

const Sidebar = ({ show, onHide }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    contact: "",
    profilePic: "",
  });

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedProfile = localStorage.getItem("user");

    if (storedProfile) {
      const parsed = JSON.parse(storedProfile);

      axios
        .post(
          "http://localhost/DeliveryTrackingSystem/check_delivery_personnel.php",
          {
            pers_username: parsed.pers_username,
          }
        )
        .then((response) => {
          const data = response.data;

          if (data.success) {
            const user = data.user;

            const profilePicUrl = user.pers_profile_pic
              ? `http://localhost//DeliveryTrackingSystem/uploads/personnel_profile_pic/${user.pers_profile_pic}`
              : `http://localhost//DeliveryTrackingSystem/default-profile-pic.png`;

            setProfile({
              name: `${user.pers_fname} ${user.pers_lname}`,
              email: user.pers_email,
              contact: user.pers_phone,
              profilePic: profilePicUrl,
              userId: user.pers_username,
            });

            const updatedUser = {
              ...parsed,
              pers_profile_pic: user.pers_profile_pic,
            };
            localStorage.setItem("user", JSON.stringify(updatedUser));
          } else {
            console.warn("User not a delivery personnel:", data.message);
          }
        })
        .catch((error) => {
          console.error("Axios error:", error);
        });
    }
  }, []);

  const handleProfileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const storedUser = JSON.parse(localStorage.getItem("user"));
    const formData = new FormData();
    formData.append("profile_pic", file);
    formData.append("pers_username", storedUser.pers_username);

    try {
      const response = await axios.post(
        "http://localhost/DeliveryTrackingSystem/upload_profile_pic.php",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        const newPicUrl = response.data.image_url;

        setProfile((prev) => ({ ...prev, profilePic: newPicUrl }));

        const updatedUser = { ...storedUser, pers_profile_pic: newPicUrl };
        localStorage.setItem("user", JSON.stringify(updatedUser));

        ToastHelper.success("Profile picture updated successfully!");
      } else {
        ToastHelper.error("Upload failed: " + response.data.message);
      }
    } catch (err) {
      console.error("Upload error:", err);
      ToastHelper.error("An error occurred while uploading the picture.");
    }
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      localStorage.removeItem("user");
      navigate("/");
    }, 800); //
  };

  const userName = profile.name;
  const userId = profile.userId;

  return (
    <>
      {loading && (
        <div className="loading-overlay">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Logging out...</span>
          </div>
        </div>
      )}

      <Offcanvas
        show={show}
        onHide={onHide}
        placement="start"
        backdropClassName="custom-backdrop"
        className="custom-offcanvas"
      >
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
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "http://localhost/DeliveryTrackingSystem/default-profile-pic.png";
                    }}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
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
                { name: "Failed Deliveries", path: "/failed-delivery" },
                { name: "Guide", path: "/driver-guide" },
                { name: "Logout", path: "logout" },
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
                    if (item.name === "Logout") {
                      setShowLogoutModal(true);
                      onHide();
                    } else {
                      navigate(item.path);
                      onHide();
                    }
                  }}
                >
                  {item.name}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        </Offcanvas.Body>
      </Offcanvas>

      <Modal
        show={showLogoutModal}
        onHide={() => setShowLogoutModal(false)}
        centered
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="text-dark">Confirm Logout</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-white">
          Are you sure you want to logout?
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button
            className="cancel-logout btn btn-outline-secondary bg-white px-3 py-2 fs-6 fw-semibold"
            onClick={() => setShowLogoutModal(false)}
          >
            Cancel
          </Button>
          <Button
            className="logout-btn btn btn-danger px-3 py-2 fs-6 fw-semibold"
            onClick={confirmLogout}
          >
            Logout
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Sidebar;
