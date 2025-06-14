import React, { useState } from "react";
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
  FaPlus,
} from "react-icons/fa";
import { Modal, Button } from "react-bootstrap";
import "./loading-overlay.css";

const AdminLayout = ({ title, onAddClick, children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const navigate = useNavigate();

  const confirmLogout = () => {
    setShowLogoutModal(false);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      localStorage.removeItem("user");
      navigate("/");
    }, 500);
  };

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      {/* LOADING OVERLAY */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Logging out...</span>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
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
          <button className="nav-btn" onClick={() => navigate("/admin-dashboard")}>
            <FaHome className="icon" /> DASHBOARD
          </button>
          <button className="nav-btn" onClick={() => navigate("/delivery-details")}>
            <FaClipboardList className="icon" /> DELIVERY DETAILS
          </button>
          <button className="nav-btn" onClick={() => navigate("/monitor-delivery")}>
            <FaTruck className="icon" /> MONITOR DELIVERY
          </button>
          <button className="nav-btn" onClick={() => navigate("/generate-report")}>
            <FaChartBar className="icon" /> GENERATE REPORT
          </button>
          <button className="nav-btn" onClick={() => navigate("/settings")}>
            <FaCog className="icon" /> SETTINGS
          </button>
          <button className="nav-btn logout" onClick={() => setShowLogoutModal(true)}>
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
            <h2 className="fs-1 fw-bold m-0">{title}</h2>
          </div>

          <div className="search-bar position-relative me-3">
            <input type="text" placeholder="Search..." />
            <FaSearch className="search-icon" />
          </div>
        </div>

        {onAddClick && (
          <div className="text-end mx-4 my-5 d-flex justify-content-end">
            <button
              className="add-delivery rounded-2 px-3 py-2 fs-6 d-flex align-items-center gap-2"
              onClick={onAddClick}
            >
              <FaPlus /> Add New Delivery
            </button>
          </div>
        )}

        {children}
      </main>

      {/* LOGOUT MODAL */}
      <Modal show={showLogoutModal} onHide={() => setShowLogoutModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">Confirm Logout</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to logout?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLogoutModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmLogout}>
            Logout
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminLayout;
