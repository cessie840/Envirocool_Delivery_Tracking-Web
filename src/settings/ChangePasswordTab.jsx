import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FaLock, FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { Toaster, toast } from "sonner";

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

  const [focusedField, setFocusedField] = useState("");
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

    const confirm = await Swal.fire({
      text: "Do you want to change your password?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#288B44FF",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, change it",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await axios.post(
        "http://localhost/DeliveryTrackingSystem/change_adops_password.php",
        { currentPassword, newPassword },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      if (res.data.success) {
        toast.success("Password changed successfully!", {
          duration: 2500,
          style: {
            background: "#DEF1E0FF",
            border: "1px solid #77BB79FF",
            color: "#2E7D32",
            fontWeight: 600,
            fontSize: "1.1rem",
            textAlign: "center",
            width: "100%",
            maxWidth: "600px",
            margin: "0 auto",
            justifyContent: "center",
          },
        });

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
      } else {
        setMessage({
          text: res.data.error || "Password change failed.",
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
              e.preventDefault();
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
    <div className="settings p-4 rounded position-relative">
      <Toaster position="top-center" richColors />

      <h4 className="title mb-3">
        <FaLock /> Change Password
      </h4>
      <p>Change your password here.</p>
      <hr />

      {message.text && message.type === "error" && (
        <div
          className="alert alert-danger mb-3"
          role="alert"
          style={{
            fontSize: "1rem",
            padding: "10px 12px",
            borderRadius: "6px",
          }}
        >
          {message.text}
        </div>
      )}

      {renderPasswordInput("Current Password", "currentPassword")}
      {renderPasswordInput("New Password", "newPassword")}

      <div className="mt-2" style={{ fontSize: "0.95rem" }}>
        <p
          style={{ color: validation.length ? "green" : "#8B0000", margin: 0 }}
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
          style={{ color: validation.number ? "green" : "#8B0000", margin: 0 }}
        >
          • Contains at least one number
        </p>
        <p
          style={{ color: validation.special ? "green" : "#8B0000", margin: 0 }}
        >
          • Contains at least one special character (! @ # $ % ^ & * ...)
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
    </div>
  );
};

export default ChangePasswordTab;
