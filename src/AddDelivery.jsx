import logo from "./assets/envirocool-logo.png";
import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import {
  FaClipboardList,
  FaTruck,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
  FaSearch,
  FaHome,
  FaBars,
  FaTimes,
} from "react-icons/fa";

const AddDelivery = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const navigate = useNavigate();

  const handleAddDelivery = () => navigate("/add-delivery");
  const handleDashboard = () => navigate("/dashboard");
  const handleDeliveryDetails = () => navigate("/delivery-details");
  const handleMonitorDelivery = () => navigate("/monitor-delivery");
  const handleGenerateReport = () => navigate("/generate-report");
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
        {/* NAVIGATION */}
        <nav className="nav-buttons">
          <button className="nav-btn" onClick={handleDashboard}>
            <FaHome className="icon" /> DASHBOARD
          </button>
          <button className="nav-btn" onClick={handleDeliveryDetails}>
            <FaClipboardList className="icon" /> DELIVERY DETAILS
          </button>
          <button className="nav-btn" onClick={handleMonitorDelivery}>
            <FaTruck className="icon" /> MONITOR DELIVERY
          </button>
          <button className="nav-btn" onClick={handleGenerateReport}>
            <FaChartBar className="icon" /> GENERATE REPORT
          </button>
          <button className="nav-btn" onClick={handleSettings}>
            <FaCog className="icon" /> SETTINGS
          </button>
          <button className="nav-btn logout" onClick={handleLogout}>
            <FaSignOutAlt className="icon" /> LOGOUT
          </button>
        </nav>
      </aside>

      {/* MAIN PANEL */}
      <main className="main-panel flex-grow-1 p-4">
        {/* HEADER  */}
        <div className="dashboard-header d-flex justify-content-between align-items-center">
          {/* TOGGLE  BUTTON */}
          <div className="d-flex align-items-center">
            <button className="btn d-lg-none me-0" onClick={toggleSidebar}>
              {isSidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <h2 className="fs-1 fw-bold m-0">Dashboard</h2>
          </div>
          <div className="search-bar position-relative me-3">
            <input type="text" placeholder="Search..." />
            <FaSearch className="search-icon" />
          </div>
        </div>

        {/* MAIN CONTENT  */}
        <div className="add-delivery-container mt-4 p-4 border rounded">
          <div className="header-info mb-3">
            <p>
              <strong>Transaction No.:</strong> 00000001
            </p>
            <p>
              <strong>P.O. No.:</strong> 00000001
            </p>
          </div>
          <hr />

          {/* CUSTOMER DETAILS FORM */}
          <form className="delivery-form">
            <h4 className="mb-3">Customer Details</h4>
            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="customerName" className="form-label">
                  Enter Customer's Name:
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="customerName"
                  placeholder="Customer's Name"
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="dateOfOrder" className="form-label">
                  Date of Order:
                </label>
                <input type="date" className="form-control" id="dateOfOrder" />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="customerAddress" className="form-label">
                Enter Customer's Address:
              </label>
              <input
                type="text"
                className="form-control"
                id="customerAddress"
                placeholder="Customer's Address"
              />
            </div>

            <div className="row mb-4">
              <div className="col-md-6">
                <label htmlFor="contactNumber" className="form-label">
                  Enter Customer's Contact Number:
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="contactNumber"
                  placeholder="Customer's Contact No."
                />
              </div>
              <div className="col-md-6">
                <label className="form-label d-block container-fluid">
                  Mode of Payment:
                </label>
                <div className="MOP d-flex justify-content-center gap-4 gap-md-3 container-fluid">
                  <div className="form-check d-flex">
                    <label
                      className="form-check-label me-5 mx-md-4.5"
                      htmlFor="cash"
                    >
                      Cash
                    </label>
                    <input
                      className="form-check-input"
                      type="radio"
                      name="payment"
                      id="cash"
                      value="Cash"
                    />
                  </div>
                  <div className="form-check d-flex">
                    <label
                      className="form-check-label me-5 mx-md-4.5"
                      htmlFor="cod"
                    >
                      COD
                    </label>
                    <input
                      className="form-check-input"
                      type="radio"
                      name="payment"
                      id="cod"
                      value="COD"
                    />
                  </div>
                  <div className="form-check d-flex">
                    <label
                      className="form-check-label me-5 mx-md-4.5"
                      htmlFor="card"
                    >
                      Card
                    </label>
                    <input
                      className="form-check-input"
                      type="radio"
                      name="payment"
                      id="card"
                      value="Card"
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* ORDER DETAILS */}
          <div className="order-details mt-5">
            <h4 className="mb-4">Order Details</h4>
            <table className="order-table">
              <thead>
                <tr>
                  <th>Quantity</th>
                  <th>Description</th>
                  <th>Unit Cost</th>
                  <th>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <input type="number" placeholder="0" />
                  </td>
                  <td>
                    <input type="text" placeholder="Item description" />
                  </td>
                  <td>
                    <input type="number" placeholder="₱0.00" />
                  </td>
                  <td>
                    <input type="number" placeholder="₱0.00" />
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="order-summary mt-4">
              <label>
                Down Payment:
                <input type="number" placeholder="₱0.00" />
              </label>
              <label>
                Balance:
                <input type="number" placeholder="₱0.00" />
              </label>
              <label>
                Total:
                <input type="number" placeholder="₱0.00" />
              </label>
            </div>

            <div className="btn-group m-3 fs-6 gap-4">
              <button type="reset" className="cancel-btn">
                Cancel
              </button>
              <button type="submit" className="add-btn">
                Add
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddDelivery;
