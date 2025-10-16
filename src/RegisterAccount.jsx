import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import OperationalLayout from "./OperationalLayout";

const RegisterAccount = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [accountData, setAccountData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    profilePicture: null,
  });

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    document.title = "Register Account";
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profilePicture") {
      setAccountData((prev) => ({
        ...prev,
        profilePicture: files[0],
      }));
    } else {
      setAccountData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { username, password, confirmPassword, profilePicture } = accountData;

    if (!username || !password || !confirmPassword || !profilePicture) {
      setErrorMessage("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    // Combine data from previous page + this form
    const formData = new FormData();
    Object.entries(state).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append("username", username);
    formData.append("password", password);
    formData.append("profilePic", profilePicture);

    try {
      const res = await axios.post(
        "http:/localhost/DeliveryTrackingSystem/create_delivery_personnel.php",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const data = res.data;
      if (data.status === "success") {
        alert("Delivery Personnel Account created successfully!");
        navigate("/operational-delivery-details");
      } else {
        setErrorMessage(data.message || "An error occurred.");
      }
    } catch (err) {
      setErrorMessage("Failed to connect to the server.");
    }
  };

  return (
    <OperationalLayout title="Create Delivery Personnel Account">
      <div className="add-delivery-form-container mt-5 mx-auto">
        <div className="form-card mx-auto p-4">
          <h2 className="form-title text-center">REGISTER ACCOUNT</h2>
          <hr />
          <form className="personnel-form" onSubmit={handleSubmit}>
            <div className="form-group mt-3">
              <label htmlFor="username">
                Username <span className="required">*</span>
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={accountData.username}
                onChange={handleChange}
                placeholder="Username"
              />
            </div>

            <div className="form-group mt-3">
              <label htmlFor="password">
                Password <span className="required">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={accountData.password}
                onChange={handleChange}
                placeholder="Password"
              />
            </div>

            <div className="form-group mt-3">
              <label htmlFor="confirmPassword">
                Confirm Password <span className="required">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={accountData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
              />
            </div>

            <div className="form-group mt-3">
              <label htmlFor="profilePicture">
                Upload Profile Picture <span className="required">*</span>
              </label>
              <input
                type="file"
                id="profilePicture"
                name="profilePicture"
                className="form-control"
                accept="image/*"
                onChange={handleChange}
              />
            </div>

            {errorMessage && (
              <div className="text-danger fw-bold text-center mt-3">
                {errorMessage}
              </div>
            )}

            <div className="d-flex justify-content-end mt-4">
              <button
                type="submit"
                className="btn bg-success add-btn rounded-3 px-3"
              >
                Register
              </button>
            </div>
          </form>
        </div>
      </div>
    </OperationalLayout>
  );
};

export default RegisterAccount;
