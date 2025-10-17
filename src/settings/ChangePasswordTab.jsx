import React, { useState } from "react";
import axios from "axios";
import { FaLock, FaRegEye, FaRegEyeSlash } from "react-icons/fa";

const ChangePasswordTab = ({ role }) => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [focusedField, setFocusedField] = useState(""); // track focused field

  const [validation, setValidation] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false,
  });

  const [message, setMessage] = useState({ text: "", type: "" });

  const validatePassword = (password) => {
    const rules = {
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    setValidation(rules);
    return Object.values(rules).every(Boolean);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "newPassword") validatePassword(value);
  };

  const togglePassword = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleFocus = (field) => setFocusedField(field);
  const handleBlur = () => setFocusedField("");

  const handleSubmit = async () => {
    const { currentPassword, newPassword, confirmPassword } = formData;
    setMessage({ text: "", type: "" });

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ text: "All fields are required.", type: "error" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ text: "New passwords do not match.", type: "error" });
      return;
    }

    if (!validatePassword(newPassword)) {
      setMessage({
        text: "Password does not meet the required strength criteria.",
        type: "error",
      });
      return;
    }

    const url =
      "https://13.239.143.31/DeliveryTrackingSystem/change_adops_password.php";

    try {
      const response = await axios.post(
        url,
        { currentPassword, newPassword },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.data.success) {
        alert("Password changed successfully!");
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setValidation({
          length: false,
          uppercase: false,
          number: false,
          special: false,
        });
        setMessage({ text: "", type: "" });
      } else {
        setMessage({
          text: response.data.error || "Password change failed.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Password change failed:", error);
      setMessage({
        text: error.response?.data?.error || "An unexpected error occurred.",
        type: "error",
      });
    }
  };

  // Reusable password input
const renderPasswordInput = (label, name) => (
  <div className="form-group mb-3 position-relative">
    <label>{label}</label>
    <div className="position-relative">
      <input
        type={showPassword[name] ? "text" : "password"}
        name={name}
        className="settings form-control pe-5"
        value={formData[name]}
        onChange={handleChange}
        onFocus={() => handleFocus(name)}
        onBlur={handleBlur}
        autoComplete="off"
      />
      {focusedField === name && (
        <span
          onMouseDown={(e) => {
            e.preventDefault(); // keeps input focused
            togglePassword(name);
          }}
          className="position-absolute end-0 top-50 translate-middle-y me-3"
          style={{ cursor: "pointer", color: "#555" }}
        >
          {showPassword[name] ? <FaRegEyeSlash /> : <FaRegEye />}
        </span>
      )}
    </div>
  </div>
);


  return (
    <div className="settings p-4 rounded">
      <h4 className="title mb-3">
        <FaLock /> Change Password
      </h4>
      <p>Change your password here.</p>
      <hr />

      {renderPasswordInput("Current Password", "currentPassword")}
      {renderPasswordInput("New Password", "newPassword")}

      {/* Always show password requirements */}
      <div className="mt-2" style={{ fontSize: "0.95rem" }}>
        <p style={{ color: validation.length ? "green" : "#8B0000", margin: 0 }}>
          • At least 6 characters
        </p>
        <p style={{ color: validation.uppercase ? "green" : "#8B0000", margin: 0 }}>
          • Contains at least one uppercase letter
        </p>
        <p style={{ color: validation.number ? "green" : "#8B0000", margin: 0 }}>
          • Contains at least one number
        </p>
        <p style={{ color: validation.special ? "green" : "#8B0000", margin: 0 }}>
          • Contains at least one special character (! @ # $ % ^ & * ( ) , . ? " : {'{'} {'}'} | &lt; &gt;)
        </p>
      </div>

      {renderPasswordInput("Confirm New Password", "confirmPassword")}

      <hr />

      <button
        className="btn add-btn px-4 py-2 fs-6 rounded-2 mt-2"
        onClick={handleSubmit}
      >
        Change Password
      </button>

      {message.text && message.type === "error" && (
        <div
          className="alert alert-danger mt-3"
          role="alert"
          style={{
            fontSize: "0.9rem",
            padding: "10px 12px",
            borderRadius: "6px",
            fontWeight: 500,
          }}
        >
          {message.text}
        </div>
      )}
    </div>
  );
};

export default ChangePasswordTab;
