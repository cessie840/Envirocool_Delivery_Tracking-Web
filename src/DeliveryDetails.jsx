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

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const navigate = useNavigate();

  const handleAddDelivery = () => navigate("/add-delivery");
  const handleDashboard = () => navigate("/dashboard");
  const handleDeliveryDetails = () => navigate("/delivery-details");
  const handleViewDelivery = () => navigate("/view-delivery")
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
        {/* NAVIGATIONS  */}
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

      {/* MAIN CONTENT  */}
      <main className="main-panel flex-grow-1 p-4">
        {/* HEADER  */}
        <div className="dashboard-header d-flex justify-content-between align-items-center">
          {/* TOGGLE  BUTTON */}
          <div className="d-flex align-items-center">
            <button className="btn d-lg-none me-0" onClick={toggleSidebar}>
              {isSidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <h2 className="header fs-1 fw-bold m-0">Delivery Details</h2>
          </div>

          {/* SEARCH BAR */}
          <div className="search-bar position-relative me-3">
            <input type="text" placeholder="Search..." />
            <FaSearch className="search-icon" />
          </div>
        </div>

        {/* ADD DELIVERY BUTTON  */}
        <div className="text-end mx-4 my-5">
          <button
            className="add-delivery rounded-2 px-5 py-2 fs-5"
            onClick={handleAddDelivery}
          >
            Add Delivery
          </button>
        </div>
        {/* DASHBOARD CONTENT  */}
        {/* <div className="dashboard-content text-center mt-5 fs-4 border p-5"> */}
          <table className="delivery-table container-fluid">
            <thead>
              <tr>
                <th>Transaction No.</th>
                <th>Customer Name</th>
                <th>Item Name</th>
                <th>Item/s Ordered</th>
                <th>Total Amount</th>
                <th>Delivery Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>000000001</td>
                <td>Daniel Padila</td>
                <td>Samsung S-Inverter Split Type Aircon</td>
                <td>4</td>
                <td>200000</td>
                <td>Ongoing</td>
                <td>
                  <button className="bg-success px-2 py-1 m-2 fw-normal fs-6 border-light rounded-3" onClick={handleViewDelivery}>View</button>
                  <button className="bg-danger px-2 py-1 m-2 fw-normal fs-6  border-light rounded-3">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        {/* </div> */}
      </main>
    </div>
  );
};

export default Dashboard;
