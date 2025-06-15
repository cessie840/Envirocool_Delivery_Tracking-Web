import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import OperationalLayout from "./OperationalLayout";

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
        setErrorMessage("All fields must be filled out.");
        return;
      }
    }

    if (!/^09\d{9}$/.test(formData.contactNumber)) {
      setErrorMessage("Contact must start with 09 and have 11 digits.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setErrorMessage("Invalid email format.");
      return;
    }

    if (parseInt(formData.age) < 18) {
      setErrorMessage("Age must be at least 18.");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost/DeliveryTrackingSystem/create_delivery_personnel.php",
        formData,
        { headers: { "Content-Type": "application/json" } }
      );

      const data = res.data;
      console.log("Response from PHP:", data);

      switch (data.status) {
        case "success":
          alert("Delivery Personnel Account created successfully!");
          navigate("/operational-delivery-details");
          break;
        case "email_exists":
          setErrorMessage("Email is already registered.");
          break;
        case "invalid_email":
          setErrorMessage("Invalid email format.");
          break;
        case "invalid_contact":
          setErrorMessage("Invalid contact number format.");
          break;
        case "age_restriction":
          setErrorMessage("Age must be 18 or above.");
          break;
        case "db_error":
          setErrorMessage("Database error. Please try again.");
          break;
        default:
          setErrorMessage(data.message || "Unknown error occurred.");
          break;
      }
    } catch (err) {
      console.error("Server error:", err);
      setErrorMessage("Server connection failed.");
    }
  };

  return (
    <OperationalLayout title="Create Delivery Personnel Account">
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
                  Gender <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  placeholder="Gender"
                />
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

            <div className="d-flex justify-content-end mt-4">
              <button type="submit" className="btn btn-view">
                Proceed
              </button>
            </div>
          </form>
        </div>
      </div>
    </OperationalLayout>
  );
};

export default CreatePersonnelAccount;
