import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "./assets/envirocool-logo.png";
import {
  FaBars,
  FaTimes,
  FaUserFriends,
  FaClipboardList,
  FaCog,
  FaSignOutAlt,
  FaSearch,
  FaAlignRight,
  FaAlignJustify,
} from "react-icons/fa";
import { Modal, Button } from "react-bootstrap";
import "./loading-overlay.css";

const OperationalLayout = ({ children, title, searchTerm, onSearchChange }) => {
  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Sidebar toggle (open/close for mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return window.innerWidth > 991; // open if desktop, closed if mobile
  });
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // ✅ Sidebar collapse (desktop)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved === "true";
  });
  const toggleCollapse = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  // ✅ Responsive resize handler
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 991) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ Persist collapse state
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  const confirmLogout = () => {
    setShowLogoutModal(false);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      localStorage.removeItem("user");
      navigate("/");
    }, 500);
  };

  // ✅ Active link checker
  const isActive = (path) => location.pathname === path;

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
        className={`sidebar d-flex flex-column align-items-center p-3 
          ${isSidebarOpen ? "show" : ""} 
          ${isSidebarCollapsed ? "collapsed-lg" : ""}`}
      >
        {/* Close button (mobile only) */}
        <button
          className="btn close-sidebar d-lg-none align-self-end mb-3"
          onClick={toggleSidebar}
        >
          <FaTimes />
        </button>

        {/* Logo + Collapse toggle */}
        <div className="sidebar-header d-flex justify-content-between align-items-center w-100 mb-4">
          {!isSidebarCollapsed && (
            <img
              src={logo}
              alt="Envirocool Logo"
              className="logo img-fluid"
              width="200px"
            />
          )}
          <button
            className="btn collapse-toggle d-none d-lg-flex p-3"
            onClick={toggleCollapse}
            aria-label="Toggle sidebar collapse"
          >
            {isSidebarCollapsed ? <FaAlignJustify /> : <FaAlignRight />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="nav-buttons w-100">
          <button
            className={`nav-btn ${
              isActive("/personnel-accounts") ? "active" : ""
            }`}
            onClick={() => navigate("/personnel-accounts")}
          >
            <FaUserFriends className="icon" />
            {!isSidebarCollapsed && (
              <span className="nav-text">DELIVERY PERSONNEL ACCOUNTS</span>
            )}
          </button>
          <button
            className={`nav-btn ${
              isActive("/operational-delivery-details") ? "active" : ""
            }`}
            onClick={() => navigate("/operational-delivery-details")}
          >
            <FaClipboardList className="icon" />
            {!isSidebarCollapsed && (
              <span className="nav-text">DELIVERY DETAILS</span>
            )}
          </button>
          <button
            className={`nav-btn ${
              isActive("/operational-settings") ? "active" : ""
            }`}
            onClick={() => navigate("/operational-settings")}
          >
            <FaCog className="icon" />
            {!isSidebarCollapsed && <span className="nav-text">SETTINGS</span>}
          </button>
          <button
            className="nav-btn logout"
            onClick={() => setShowLogoutModal(true)}
          >
            <FaSignOutAlt className="icon" />
            {!isSidebarCollapsed && <span className="nav-text">LOGOUT</span>}
          </button>
        </nav>
      </aside>

      {/* MAIN PANEL */}
      <main className="main-panel flex-grow-1 p-4">
        <div className="dashboard-header d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            {/* Sidebar toggle (mobile) */}
            <button className="btn d-lg-none me-0" onClick={toggleSidebar}>
              {isSidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <h2 className="fs-2 fw-bold m-0">{title}</h2>
          </div>
          <div className="search-bar position-relative me-3">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm || ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
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
