import logo from "./assets/envirocool-logo.png";
import { useNavigate, useEffect } from "react-router-dom";
import axios from "axios";
import React, { useState } from "react";
import {
  FaClipboardList,
  FaCog,
  FaSignOutAlt,
  FaSearch,
  FaUserPlus,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { Row, Col, Container, Button, Form } from "react-bootstrap";

const CreatePersonnelAccount = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    birthdate: "",
    age: "",
    contactNumber: "",
    email: "",
  });

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
          alert(
            `Account created successfully!\nUsername: ${data.username}\nProfile Pic: ${data.profile_picture}`
          );
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
        case "general_error":
          setErrorMessage("Unexpected server error.");
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

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleCreateAccount = () => navigate("/create-personnel-account");
  const handleDeliveryDetails = () => navigate("/operational-delivery-details");
  const handleSettings = () => navigate("/settings");
  const handleLogout = () => navigate("/");

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      {/* SIDEBAR */}
      <aside
        className={`sidebar d-flex flex-column align-items-center p-3 ${
          isSidebarOpen ? "show" : "collapsed"
        }`}
      >
        {/* CLOSE BUTTON */}
        <button
          className="btn close-sidebar d-lg-none align-self-end mb-3"
          onClick={toggleSidebar}
        >
          <FaTimes />
        </button>{" "}
        <img
          src={logo}
          alt="Envirocool Logo"
          className="logo mb-4 img-fluid"
          width="250px"
        />
        {/* NAVIGATIONS  */}
        <nav className="nav-buttons">
          <button className="nav-btn" onClick={handleCreateAccount}>
            <FaUserPlus className="icon" /> CREATE DELIVERY PERSONNEL ACCOUNT
          </button>
          <button className="nav-btn" onClick={handleDeliveryDetails}>
            <FaClipboardList className="icon" /> DELIVERY DETAILS
          </button>
          <button className="nav-btn" onClick={handleSettings}>
            <FaCog className="icon" /> SETTINGS
          </button>
          <button className="nav-btn logout" onClick={handleLogout}>
            <FaSignOutAlt className="icon" /> LOGOUT
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT  */}
      <main className="main-panel flex-grow-1 p-4">
        {/* HEADER  */}
        <div className="dashboard-header d-flex justify-content-between align-items-center">
          {/* TOGGLE  BUTTON */}
          <div className="d-flex align-items-center">
            <button className="btn d-lg-none me-0" onClick={toggleSidebar}>
              {isSidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <h2 className="fs-1 fw-bold m-0">
              Create Delivery Personnel Account
            </h2>
          </div>

          {/* SEARCH BAR */}
          <div className="search-bar position-relative me-3">
            <input type="text" placeholder="Search..." />
            <FaSearch className="search-icon" />
          </div>
        </div>

        <div className="d-flex justify-content-between mx-4 my-5">
          {/* <button
            className="back btn rounded-2 px-1 py-1 fs-4"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft className="me-2" />
          </button> */}
        </div>
        <div className="d-flex justify-content-between mx-4 my-5">
          <Container className="personnel-form-container">
            <div className="form-card p-4">
              <h2 className="text-center mb-4">PERSONAL DETAILS</h2>
              <hr />
              <Form onSubmit={handleSubmit}>
                <Row className="mb-3">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>
                        First Name <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>
                        Last Name <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>
                        Gender <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>
                        Birthdate <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="date"
                        name="birthdate"
                        value={formData.birthdate}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>
                        Age <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>
                        Contact Number <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="contactNumber"
                        value={formData.contactNumber}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>
                        Email <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {errorMessage && (
                  <div className="text-danger text-center mb-3 fw-bold">
                    {errorMessage}
                  </div>
                )}

                <div className="text-end">
                  <Button
                    variant="primary"
                    type="submit"
                    className="add-btn bg-success"
                  >
                    Proceed
                  </Button>
                </div>
              </Form>
            </div>
          </Container>
        </div>
      </main>
    </div>
  );
};

export default CreatePersonnelAccount;
