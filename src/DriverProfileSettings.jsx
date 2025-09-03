import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Button,
  Image,
  Modal,
  Form,
  InputGroup,
} from "react-bootstrap";
import Sidebar from "./DriverSidebar";
import HeaderAndNav from "./DriverHeaderAndNav";
import { useNavigate } from "react-router-dom";
import { FaEdit } from "react-icons/fa";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function DriverProfileSettings() {
  const [showSidebar, setShowSidebar] = useState(false);
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    Name: "",
    username: "",
    Email: "",
    Contact: "",
    Age: "",
    Gender: "",
    Birthday: "",
    profilePic: "",
  });

  const [modalField, setModalField] = useState(null);
  const [fieldValue, setFieldValue] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    old: "",
    new: "",
    confirm: "",
  });

  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    const storedProfile = localStorage.getItem("user");
    const storedPassword = localStorage.getItem("userPassword");

    if (storedProfile) {
      const parsed = JSON.parse(storedProfile);

      axios
        .post(
          "http://localhost/DeliveryTrackingSystem/check_delivery_personnel.php",
          {
            pers_username: parsed.pers_username,
          }
        )
        .then((res) => {
          if (res.data.success) {
            const u = res.data.user;
            setProfile({
              Name: `${u.pers_fname} ${u.pers_lname}`,
              username: u.pers_username,
              Email: u.pers_email,
              Contact: u.pers_phone,
              Age: u.pers_age,
              Gender: u.pers_gender,
              Birthday: u.pers_birth,
              profilePic: `http://localhost/DeliveryTrackingSystem/${u.pers_profile_pic}`,
            });

         
            if (storedPassword) {
              setPasswordForm((prev) => ({ ...prev, old: storedPassword }));
            }
          } else {
            console.warn("User not found:", res.data.message);
          }
        })
        .catch((err) => console.error(err));
    }
  }, []);

  const handleSave = () => {
    const updatedProfile = { ...profile, [modalField]: fieldValue };
    setProfile(updatedProfile);

    const fieldMapping = {
      Name: ["pers_fname", "pers_lname"],
      username: "pers_username",
      Email: "pers_email",
      Contact: "pers_phone",
      Age: "pers_age",
      Gender: "pers_gender",
      Birthday: "pers_birthday",
    };

    const formData = new FormData();
    formData.append("pers_username", profile.username); 

    if (modalField === "Name") {
      const [fname, ...lnameParts] = fieldValue.split(" ");
      const lname = lnameParts.join(" ");
      formData.append("pers_fname", fname || "");
      formData.append("pers_lname", lname || "");
    } else {
      const mappedField = fieldMapping[modalField];
      if (mappedField) {
        formData.append(mappedField, fieldValue);
      }
    }

    axios
      .post(
        "http://localhost/DeliveryTrackingSystem/update_delivery_personnel.php",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      )
      .then((res) => {
        if (res.data.success) {
          alert("Profile updated successfully!");

          localStorage.setItem("userProfile", JSON.stringify(updatedProfile));
        } else {
          alert("Update failed: " + res.data.message);
        }
      })
      .catch((err) => console.error(err));

    setModalField(null);
  };

  const handlePasswordSave = () => {
    if (passwordForm.new !== passwordForm.confirm) {
      alert("New password and confirm password do not match.");
      return;
    }

    const formData = new FormData();
    formData.append("pers_username", profile.username);
    formData.append("pers_password", passwordForm.new);

    axios
      .post(
        "http://localhost/DeliveryTrackingSystem/update_delivery_personnel.php",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      )
      .then((res) => {
        if (res.data.success) {
          alert("Password successfully changed!");

          localStorage.setItem("userPassword", passwordForm.new);

          setPasswordForm({ old: passwordForm.new, new: "", confirm: "" });
          setModalField(null);
        } else {
          alert("Update failed: " + res.data.message);
        }
      })
      .catch((err) => console.error(err));
  };


  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedProfile = { ...profile, profilePic: reader.result };
        setProfile(updatedProfile);
        localStorage.setItem("userProfile", JSON.stringify(updatedProfile));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ backgroundColor: "#f0f4f7", minHeight: "100vh" }}>
      <HeaderAndNav onSidebarToggle={() => setShowSidebar(true)} />
      <Sidebar show={showSidebar} onHide={() => setShowSidebar(false)} />

      <Container className="py-4">
        <Card
          className="mx-auto shadow"
          style={{
            maxWidth: "500px",
            borderRadius: "20px",
            border: "2px solid #28B463",
          }}
        >
          <div
            className="text-center p-4"
            style={{
              borderTopLeftRadius: "20px",
              borderTopRightRadius: "20px",
              backgroundColor: "#E8F8F5",
            }}
          >
            {/* PROFILE PICTURE */}
            <label htmlFor="profilePicInput" style={{ cursor: "pointer" }}>
              <div
                className="mx-auto rounded-circle overflow-hidden border border-3 d-flex justify-content-center align-items-center"
                style={{
                  width: "120px",
                  height: "120px",
                  backgroundColor: "#dee2e6",
                  border: "2px solid #116B8A",
                }}
              >
                {profile.profilePic?.startsWith("data:image") ? (
                  <Image
                    src={profile.profilePic}
                    alt="Profile"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
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
                )}
              </div>
              <input
                id="profilePicInput"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleProfilePicChange}
              />
            </label>

            <h5 className="fw-bold mt-3 mb-1" style={{ color: "#116B8A" }}>
              {profile.Name || "Full Name"}
            </h5>
            <p className="text-muted mb-1" style={{ fontSize: "0.9rem" }}>
              ID: {profile.username || "User ID"}
            </p>
          </div>

          <div
            className="px-4 pb-4"
            style={{
              backgroundColor: "#ffffff",
              borderBottomLeftRadius: "20px",
              borderBottomRightRadius: "20px",
            }}
          >
            {[
              { label: "Full Name", key: "Name" },
              { label: "Username", key: "username" },
              { label: "Email", key: "Email" },
              { label: "Contact Number", key: "Contact" },
              { label: "Age", key: "Age" },
              { label: "Gender", key: "Gender" },
              { label: "Birthday", key: "Birthday" },
            ].map(({ label, key }) => (
              <div className="mt-3" key={key}>
                <label className="text-secondary small fw-semibold">
                  {label}
                </label>
                <InputGroup>
                  <div
                    className="form-control"
                    style={{
                      borderColor: "#116B8A",
                      color: "black",
                      backgroundColor: "#E8F8F5",
                    }}
                  >
                    {profile[key] || `Enter your ${label.toLowerCase()}`}
                  </div>
                  <Button
                    style={{
                      borderColor: "#116B8A",
                      color: "#116B8A",
                      backgroundColor: "#E8F8F5",
                      padding: "6px 10px",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                    }}
                    onClick={() => {
                      setModalField(key);
                      setFieldValue(profile[key]);
                    }}
                  >
                    <FaEdit style={{ fontSize: "1rem" }} />
                  </Button>
                </InputGroup>
              </div>
            ))}

            {/* Password */}
            <div className="mt-3">
              <label className="text-secondary small fw-semibold">
                Password
              </label>
              <InputGroup>
                <div
                  className="form-control"
                  style={{
                    borderColor: "#116B8A",
                    color: "black",
                    backgroundColor: "#E8F8F5",
                  }}
                >
                  ••••••••
                </div>
                <Button
                  style={{
                    borderColor: "#116B8A",
                    color: "#116B8A",
                    backgroundColor: "#E8F8F5",
                    padding: "6px 10px",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                  }}
                  onClick={() => setModalField("password")}
                >
                  <FaEdit />
                </Button>
              </InputGroup>
            </div>

            <div className="mt-4 d-grid">
              <Button variant="success" onClick={() => navigate("/")}>
                Logout
              </Button>
            </div>
          </div>
        </Card>
      </Container>

      {/* MODAL FOR EDITING DETAILS */}
      <Modal
        show={modalField && modalField !== "password"}
        onHide={() => setModalField(null)}
        centered
      >
        <Modal.Header closeButton style={{ backgroundColor: "#E8F8F5" }}>
          <Modal.Title>Edit {modalField}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: "#F2FDF4" }}>
          <Form.Group>
            <Form.Label>Enter new {modalField}</Form.Label>

            {/* If editing Gender, show dropdown */}
            {modalField === "Gender" ? (
              <Form.Select
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </Form.Select>
            ) : (
              <Form.Control
                type="text"
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
              />
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: "#E8F8F5" }}>
          <Button variant="secondary" onClick={() => setModalField(null)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSave}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={modalField === "password"}
        onHide={() => setModalField(null)}
        centered
      >
        <Modal.Header closeButton style={{ backgroundColor: "#E8F8F5" }}>
          <Modal.Title>Change Password</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: "#F2FDF4" }}>
 
          <Form.Group className="mb-3">
            <Form.Label>New Password</Form.Label>
            <InputGroup>
              <Form.Control
                type={showPassword.new ? "text" : "password"}
                value={passwordForm.new}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, new: e.target.value })
                }
              />
              <Button
                variant="outline-secondary"
                onClick={() =>
                  setShowPassword({ ...showPassword, new: !showPassword.new })
                }
              >
                {showPassword.new ? <FaEyeSlash /> : <FaEye />}
              </Button>
            </InputGroup>
          </Form.Group>

          {/* Confirm Password */}
          <Form.Group>
            <Form.Label>Confirm Password</Form.Label>
            <InputGroup>
              <Form.Control
                type={showPassword.confirm ? "text" : "password"}
                value={passwordForm.confirm}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirm: e.target.value,
                  })
                }
              />
              <Button
                variant="outline-secondary"
                onClick={() =>
                  setShowPassword({
                    ...showPassword,
                    confirm: !showPassword.confirm,
                  })
                }
              >
                {showPassword.confirm ? <FaEyeSlash /> : <FaEye />}
              </Button>
            </InputGroup>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: "#E8F8F5" }}>
          <Button variant="secondary" onClick={() => setModalField(null)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handlePasswordSave}>
            Save Password
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default DriverProfileSettings;
