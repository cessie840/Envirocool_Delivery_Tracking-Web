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
  FaAlignRight,
  FaAlignJustify,
  FaSearch,
} from "react-icons/fa";
import { Modal, Button } from "react-bootstrap";
import "./loading-overlay.css";

const BUTTONS = [
  {
    key: "CreatePersonnelAccount",
    label: "DELIVERY PERSONNEL ACCOUNTS",
    path: "/personnel-accounts",
    icon: FaUserFriends,
  },
  {
    key: "OperationalDelivery",
    label: "DELIVERY DETAILS",
    path: "/operational-delivery-details",
    icon: FaClipboardList,
  },
  {
    key: "OperationalSettings",
    label: "SETTINGS",
    path: "/operational-settings",
    icon: FaCog,
  },
];

const OperationalLayout = ({ children, title, searchTerm, onSearchChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => window.innerWidth > 991
  );
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    () => localStorage.getItem("sidebarCollapsed") === "true"
  );
  const [permissions, setPermissions] = useState({});

  // Load permissions
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const perms = storedUser.permissions || {};
    setPermissions(perms);

    // Redirect to first accessible page if current path is not allowed
    const currentButton = BUTTONS.find((btn) => btn.path === location.pathname);
    if (!currentButton || !perms[currentButton.key]) {
      const firstAccessible = BUTTONS.find((btn) => perms[btn.key]);
      if (firstAccessible) {
        navigate(firstAccessible.path, { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleCollapse = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth > 991);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  const confirmLogout = () => {
    setShowLogoutModal(false);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      localStorage.removeItem("user");
      localStorage.removeItem("sidebarCollapsed");
      navigate("/");
    }, 500);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      {loading && (
        <div className="loading-overlay">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Logging out...</span>
          </div>
        </div>
      )}

      <aside
        className={`sidebar d-flex flex-column align-items-center p-3 ${
          isSidebarOpen ? "show" : ""
        } ${isSidebarCollapsed ? "collapsed-lg" : ""}`}
      >
        <button
          className="btn close-sidebar d-lg-none align-self-end mb-3"
          onClick={toggleSidebar}
        >
          <FaTimes />
        </button>

        <div className="sidebar-header d-flex justify-content-between align-items-center w-100 mb-4">
          <img
            src={logo}
            alt="Envirocool Logo"
            className="logo img-fluid"
            width="200px"
          />
          <button
            className="btn collapse-toggle d-none d-lg-flex p-3"
            onClick={toggleCollapse}
            aria-label="Toggle sidebar collapse"
          >
            {isSidebarCollapsed ? <FaAlignJustify /> : <FaAlignRight />}
          </button>
        </div>

        <nav className="nav-buttons w-100">
          {BUTTONS.map((btn) =>
            permissions[btn.key] ? (
              <button
                key={btn.key}
                className={`nav-btn ${isActive(btn.path) ? "active" : ""}`}
                onClick={() => navigate(btn.path)}
              >
                <btn.icon className="icon" />
                {!isSidebarCollapsed && (
                  <span className="nav-text">{btn.label}</span>
                )}
                <span className="tooltip-text">{btn.label}</span>
              </button>
            ) : null
          )}

          <button
            className="nav-btn logout"
            onClick={() => setShowLogoutModal(true)}
          >
            <FaSignOutAlt className="icon" />
            {!isSidebarCollapsed && <span className="nav-text">LOGOUT</span>}
            <span className="tooltip-text">Logout</span>
          </button>
        </nav>
      </aside>

      <main className="main-panel flex-grow-1 p-4">
        <div className="dashboard-header d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <button className="btn d-lg-none me-0" onClick={toggleSidebar}>
              {isSidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <h2 className="fs-2 fw-bold m-0">{title}</h2>
          </div>

          {location.pathname !== "/operational-settings" && (
            <div className="search-bar position-relative me-3">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm || ""}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
              <FaSearch className="search-icon" />
            </div>
          )}
        </div>

        {children}
      </main>

      <Modal
        show={showLogoutModal}
        onHide={() => setShowLogoutModal(false)}
        centered
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="text-dark">Confirm Logout</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-white">
          Are you sure you want to logout?
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button
            className="cancel-logout btn btn-outline-secondary bg-white px-3 py-2 fs-6 fw-semibold"
            onClick={() => setShowLogoutModal(false)}
          >
            Cancel
          </Button>
          <Button
            className="logout-btn btn btn-danger px-3 py-2 fs-6 fw-semibold"
            onClick={confirmLogout}
          >
            Logout
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OperationalLayout;
