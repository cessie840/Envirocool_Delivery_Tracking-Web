import React, { useState } from "react";
import axios from "axios";
import { FaLock } from "react-icons/fa";

const ChangePasswordTab = ({ role }) => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [validation, setValidation] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false,
  });

  const [message, setMessage] = useState({ text: "", type: "" }); // For error alerts only

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

  const handleSubmit = async () => {
    const { currentPassword, newPassword, confirmPassword } = formData;
    setMessage({ text: "", type: "" }); // Clear previous error message

    // Validation checks
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ text: " All fields are required.", type: "error" });
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
        // ✅ Show success as an alert popup
        alert(" Password changed successfully!");
        // Reset fields after success
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
        setMessage({ text: "", type: "" }); // Clear error message
      } else {
        // ❌ Show backend error below button
        setMessage({
          text: response.data.error || " Password change failed.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Password change failed:", error);
      setMessage({
        text: error.response?.data?.error || " An unexpected error occurred.",
        type: "error",
      });
    }
  };

  return (
    <div className="settings p-4 rounded">
      <h4 className="title">
        <FaLock /> Change Password
      </h4>
      <p>Change your password here.</p>
      <hr />

      {/* Current password */}
      <div className="form-group mb-3">
        <label>Current Password</label>
        <input
          type="password"
          name="currentPassword"
          className="settings form-control"
          value={formData.currentPassword}
          onChange={handleChange}
          autoComplete="off"
        />
      </div>

      {/* New password */}
      <div className="form-group mb-3">
        <label>New Password</label>
        <input
          type="password"
          name="newPassword"
          className="settings form-control"
          value={formData.newPassword}
          onChange={handleChange}
          autoComplete="new-password"
        />
        <div className="mt-2" style={{ fontSize: "0.95rem" }}>
          <p
            style={{
              color: validation.length ? "green" : "#8B0000",
              margin: 0,
            }}
          >
            • At least 6 characters
          </p>
          <p
            style={{
              color: validation.uppercase ? "green" : "#8B0000",
              margin: 0,
            }}
          >
            • Contains at least one uppercase letter
          </p>
          <p
            style={{
              color: validation.number ? "green" : "#8B0000",
              margin: 0,
            }}
          >
            • Contains at least one number
          </p>
          <p
            style={{
              color: validation.special ? "green" : "#8B0000",
              margin: 0,
            }}
          >
              • Contains at least one special character (! @ # $ % ^ & * ( ) , . ? " : {'{'} {'}'} | &lt; &gt;)
          </p>
        </div>
      </div>

      {/* Confirm password */}
      <div className="form-group mb-4">
        <label>Confirm New Password</label>
        <input
          type="password"
          name="confirmPassword"
          className="settings form-control"
          value={formData.confirmPassword}
          onChange={handleChange}
          autoComplete="new-password"
        />
      </div>

      <hr />

      {/* Submit button */}
      <button
        className="btn add-btn mt-2 px-4 py-1 fs-6"
        onClick={handleSubmit}
      >
        Change Password
      </button>

      {/* Error alert message (only shows for errors) */}
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
