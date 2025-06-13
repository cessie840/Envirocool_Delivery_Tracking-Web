import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "./assets/envirocool-logo.png";
import {
  FaBars,
  FaTimes,
  FaUserPlus,
  FaClipboardList,
  FaCog,
  FaSignOutAlt,
  FaSearch,
} from "react-icons/fa";
import "./loading-overlay.css";

const OperationalLayout = ({ children, title }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLogout = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      localStorage.removeItem("user");
      navigate("/");
    }, 500);
  };

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      {/* SIDEBAR */}

      {/* LOADING OVERLAY  */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Logging out...</span>
          </div>
        </div>
      )}
      <aside
        className={`sidebar d-flex flex-column align-items-center p-3 ${
          isSidebarOpen ? "show" : "collapsed"
        }`}
      >
        <button
          className="btn close-sidebar d-lg-none align-self-end mb-3"
          onClick={toggleSidebar}
        >
          <FaTimes />
        </button>
        <img
          src={logo}
          alt="Envirocool Logo"
          className="logo mb-4 img-fluid"
          width="250px"
        />
        <nav className="nav-buttons">
          <button
            className="nav-btn"
            onClick={() => navigate("/create-personnel-account")}
          >
            <FaUserPlus className="icon" /> CREATE DELIVERY PERSONNEL ACCOUNT
          </button>
          <button
            className="nav-btn"
            onClick={() => navigate("/operational-delivery-details")}
          >
            <FaClipboardList className="icon" /> DELIVERY DETAILS
          </button>
          <button
            className="nav-btn"
            onClick={() => navigate("/operational-settings")}
          >
            <FaCog className="icon" /> SETTINGS
          </button>
          <button className="nav-btn logout" onClick={handleLogout}>
            <FaSignOutAlt className="icon" /> LOGOUT
          </button>
        </nav>
      </aside>

      {/* MAIN PANEL */}
      <main className="main-panel flex-grow-1 p-4">
        <div className="dashboard-header d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <button className="btn d-lg-none me-0" onClick={toggleSidebar}>
              {isSidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <h2 className="fs-2 fw-bold m-0">{title}</h2>
          </div>
          <div className="search-bar position-relative me-3">
            <input type="text" placeholder="Search..." />
            <FaSearch className="search-icon" />
          </div>
        </div>

        {children}
      </main>
    </div>
  );
};

export default OperationalLayout;
