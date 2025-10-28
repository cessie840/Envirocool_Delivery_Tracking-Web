import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import OperationalLayout from "./OperationalLayout";
import { FaArrowLeft } from "react-icons/fa";
import { ToastHelper } from "./helpers/ToastHelper";


const CreatePersonnelAccount = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    birthdate: "",
    age: "",
    contactNumber: "",
    email: "",
  });

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    document.title = "Create Delivery Personnel Account";
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "birthdate") {
      const birthDate = new Date(value);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        calculatedAge--;
      }

      setFormData((prev) => ({
        ...prev,
        birthdate: value,
        age: calculatedAge.toString(),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    for (let key in formData) {
      if (formData[key].trim() === "") {
        setErrorMessage(
          `Please fill in your ${key.replace(/([A-Z])/g, " $1").toLowerCase()}.`
        );
        return;
      }
    }

    // 2. Contact Number Validation
    if (!/^09\d{9}$/.test(formData.contactNumber)) {
      setErrorMessage(
        "Contact number must start with '09' and be exactly 11 digits."
      );
      return;
    }

    // 3. Email Validation
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setErrorMessage(
        "Please enter a valid email address (e.g., example@email.com)."
      );
      return;
    }

    // 4. Age Check
    if (parseInt(formData.age) < 18) {
      setErrorMessage("You must be at least 18 years old to register.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost/DeliveryTrackingSystem/create_delivery_personnel.php",
        formData
      );

      console.log(response.data);

      if (response.data.status === "success") {
        ToastHelper.success(`Account created!`);
        navigate("/personnel-accounts");
      } else if (response.data.status === "existing_account") {
        setErrorMessage(response.data.message);
      } else {
        setErrorMessage(
          response.data.message || "Registration failed due to a server error."
        );
      }
    } catch (error) {
      setErrorMessage(
        "Unable to connect to the server. Please try again later."
      );
      console.error(error);
    }
  };
  return (
    <OperationalLayout title="Create Delivery Personnel Account">
      <div className="d-flex justify-content-start mt-5 ms-4">
        <button
          className="back-btn btn-success d-flex align-items-center gap-2 rounded-2"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft /> Back
        </button>
      </div>
      <div className="add-delivery-form-container mt-5 mx-auto">
        <div className="form-card mx-auto">
          <h2 className="form-title">PERSONAL DETAILS</h2>
          <hr />
          <form className="personnel-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">
                  First Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First Name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">
                  Last Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last Name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="gender">
                  Sex <span className="required">*</span>
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Select Sex</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="birthdate">
                  Birthdate <span className="required">*</span>
                </label>
                <input
                  type="date"
                  id="birthdate"
                  name="birthdate"
                  value={formData.birthdate}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="age">
                  Age <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="Age"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">
                  Email <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                />
              </div>
              <div className="form-group">
                <label htmlFor="contactNumber">
                  Contact Number <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="contactNumber"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  placeholder="Contact Number"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="text-danger fw-bold text-center my-3">
                {errorMessage}
              </div>
            )}
          </form>
        </div>
        <div className="d-flex justify-content-end mt-4">
          <button
            type="submit"
            className="btn btn-view px-3 py-1 fs-6"
            onClick={handleSubmit}
          >
            Register
          </button>
        </div>
      </div>
    </OperationalLayout>
  );
};

export default CreatePersonnelAccount;
