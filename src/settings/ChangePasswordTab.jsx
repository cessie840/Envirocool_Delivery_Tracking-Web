import React, { useState } from "react";
import axios from "axios";
import { FaLock } from "react-icons/fa";

const ChangePasswordTab = ({ role }) => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const { currentPassword, newPassword, confirmPassword } = formData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("All fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("New passwords do not match.");
      return;
    }

    const url =
      role === "admin"
        ? "http://localhost/DeliveryTrackingSystem/change_admin_password.php"
        : "http://localhost/DeliveryTrackingSystem/change_operational_password.php";

    try {
      const response = await axios.post(url, JSON.stringify(formData), {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        alert("Password changed successfully.");
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        alert(response.data.error || "Password change failed.");
      }
    } catch (error) {
      console.error("Password change failed:", error);
      alert(error.response?.data?.error || "Password change failed.");
    }
  };

  return (
    <div className="settings p-4 rounded">
      <h4 className="title">
        <FaLock /> Change Password
      </h4>
      <p>Change your password here.</p>
      <hr />
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
      </div>
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
      <button className="btn add-btn mt-2" onClick={handleSubmit}>
        Change Password
      </button>
    </div>
  );
};

export default ChangePasswordTab;
