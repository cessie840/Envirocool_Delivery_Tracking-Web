import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "./assets/envirocool-logo.png";
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

const AdminDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Page Title 
  useEffect(() => {
    document.title = "Admin Dashboard";
  }, []);

  // Sidebar Toggle
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Navigation Hanlders
  const handleAddDelivery = () => navigate("/add-delivery");
  const handleDashboard = () => navigate("/dashboard");
  const handleDeliveryDetails = () => navigate("/delivery-details");
  const handleMonitorDelivery = () => navigate("/monitor-delivery");
  const handleGenerateReport = () => navigate("/generate-report");
  const handleSettings = () => navigate("/settings");

  // Logout with loading
  const handleLogout = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      localStorage.removeItem("user");
      navigate("/");
    }, 1200);
  };

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
        </button>

        {/* LOGO */}
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

          {/* LOADING OVERLAY */}
          {loading && (
            <div className="loading-overlay">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-panel flex-grow-1 p-4">
        {/* HEADER */}
        <div className="dashboard-header d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <button className="btn d-lg-none me-0" onClick={toggleSidebar}>
              {isSidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <h2 className="fs-1 fw-bold m-0">Dashboard</h2>
          </div>

          {/* SEARCH BAR */}
          <div className="search-bar position-relative me-3">
            <input type="text" placeholder="Search..." />
            <FaSearch className="search-icon" />
          </div>
        </div>

        {/* ADD DELIVERY BUTTON */}
        <div className="text-end mx-4 my-5">
          <button
            className="add-delivery rounded-2 px-5 py-2 fs-5"
            onClick={handleAddDelivery}
          >
            Add Delivery
          </button>
        </div>

        {/* DASHBOARD CONTENT */}
        <div className="dashboard-content text-center mt-5 fs-4 border p-5">
          <p>Analytics Here</p>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
