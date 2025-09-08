import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "./assets/envirocool-logo.png";
import {
  FaBars,
  FaTimes,
  FaUserFriends,
  FaClipboardList,
  FaCog,
  FaSignOutAlt,
  FaSearch,
} from "react-icons/fa";
import { Modal, Button } from "react-bootstrap";
import "./loading-overlay.css";

const OperationalLayout = ({ children, title }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

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
          <button
            className="nav-btn"
            onClick={() => navigate("/personnel-accounts")}
          >
            <FaUserFriends className="icon" /> DELIVERY PERSONNEL ACCOUNTS
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
          <button
            className="nav-btn logout"
            onClick={() => setShowLogoutModal(true)}
          >
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

      {/* LOGOUT MODAL */}
      <Modal
        show={showLogoutModal}
        onHide={() => setShowLogoutModal(false)}
        centered
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="text-danger">Confirm Logout</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-white">
          Are you sure you want to logout?
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button
            className="close-btn p-2 fs-6"
            variant="secondary"
            onClick={() => setShowLogoutModal(false)}
          >
            Cancel
          </Button>
          <Button className="cancel-btn p-2 fs-6" onClick={confirmLogout}>
            Logout
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OperationalLayout;
