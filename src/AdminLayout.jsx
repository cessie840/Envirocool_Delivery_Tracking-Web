import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
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
  FaAlignRight,
  FaAlignJustify,
  FaTimes,
  FaPlus,
  FaUserFriends,
} from "react-icons/fa";
import { Modal, Button } from "react-bootstrap";
import "./loading-overlay.css";

const AdminLayout = ({
  title,
  onAddClick,
  showSearch = true,
  onSearch,
  children,
}) => {
  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const confirmLogout = () => {
    setShowLogoutModal(false);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      localStorage.removeItem("user");
      navigate("/");
    }, 500);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) onSearch(value);
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return window.innerWidth > 991;
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved === "true";
  });

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleCollapse = () => setIsSidebarCollapsed(!isSidebarCollapsed);

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

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  // Allowed paths from backend. null = not fetched yet.
  const [allowedPaths, setAllowedPaths] = useState(null);

  useEffect(() => {
    const userRaw = localStorage.getItem("user");
    if (!userRaw) {
      // no user — don't request, keep allowedPaths as null (show all while not authenticated)
      return;
    }

    let user;
    try {
      user = JSON.parse(userRaw);
    } catch (e) {
      console.error("Invalid user data in localStorage", e);
      return;
    }

    const fetchAllowed = async () => {
      try {
        const res = await axios.post(
          "http://localhost/DeliveryTrackingSystem/get_user_components.php",
          {
            username: user.username,
            role: user.role,
          }
        );

        if (res.data && res.data.success && Array.isArray(res.data.data)) {
          // res.data.data is array of { name, path }
          setAllowedPaths(res.data.data.map((c) => c.path));
        } else {
          console.warn(
            "Unexpected response from get_user_components.php",
            res.data
          );
          setAllowedPaths([]); // no permissions
        }
      } catch (err) {
        console.error("Failed to fetch allowed components:", err);
        // keep allowedPaths null so UI remains usable (optimistic)
        setAllowedPaths([]); // or set null to keep optimistic behavior; choose [] to hide if you prefer
      }
    };

    fetchAllowed();
  }, []);

  // helper: if allowedPaths === null -> allow everything (optimistic), otherwise check inclusion
  const canShow = (path) => {
    if (allowedPaths === null) return true;
    return allowedPaths.includes(path);
  };

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
        className={`sidebar d-flex flex-column align-items-center p-3 
    ${isSidebarOpen ? "show" : ""} 
    ${isSidebarCollapsed ? "collapsed-lg" : ""}`}
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
            width="250px"
          />
          <button
            className="btn collapse-toggle d-none d-lg-flex p-3"
            onClick={toggleCollapse}
            aria-label="Toggle sidebar collapse"
          >
            {isSidebarCollapsed ? <FaAlignJustify /> : <FaAlignRight />}{" "}
          </button>
        </div>

        <nav className="nav-buttons">
          {canShow("/admin-dashboard") && (
            <button
              className={`nav-btn ${
                isActive("/admin-dashboard") ? "active" : ""
              }`}
              onClick={() => navigate("/admin-dashboard")}
            >
              <FaHome className="icon" />
              <span className="nav-text"> DASHBOARD</span>
              <span className="tooltip-text">Dashboard</span>
            </button>
          )}

          {canShow("/delivery-details") && (
            <button
              className={`nav-btn ${
                isActive("/delivery-details") ? "active" : ""
              }`}
              onClick={() => navigate("/delivery-details")}
            >
              <FaClipboardList className="icon" />
              <span className="nav-text"> DELIVERY DETAILS</span>
              <span className="tooltip-text">Delivery Details</span>
            </button>
          )}

          {canShow("/monitor-delivery") && (
            <button
              className={`nav-btn ${
                isActive("/monitor-delivery") ? "active" : ""
              }`}
              onClick={() => navigate("/monitor-delivery")}
            >
              <FaTruck className="icon" />
              <span className="nav-text"> MONITOR DELIVERY</span>
              <span className="tooltip-text">Monitor Delivery</span>
            </button>
          )}

          {canShow("/generate-report") && (
            <button
              className={`nav-btn ${
                isActive("/generate-report") ? "active" : ""
              }`}
              onClick={() => navigate("/generate-report")}
            >
              <FaChartBar className="icon" />
              <span className="nav-text"> DATA ANALYTICS & REPORT</span>
              <span className="tooltip-text">Data Analytics & Report</span>
            </button>
          )}

          {canShow("/user-management") && (
            <button
              className={`nav-btn ${
                isActive("/user-management") ? "active" : ""
              }`}
              onClick={() => navigate("/user-management")}
            >
              <FaUserFriends className="icon" />
              <span className="nav-text">
                CREATE DELIVERY PERSONNEL ACCOUNTS
              </span>
              <span className="tooltip-text">Delivery Personnel Accounts</span>
            </button>
          )}

          {canShow("/admin-settings") && (
            <button
              className={`nav-btn ${
                isActive("/admin-settings") ? "active" : ""
              }`}
              onClick={() => navigate("/admin-settings")}
            >
              <FaCog className="icon" />
              <span className="nav-text"> SETTINGS</span>
              <span className="tooltip-text">Settings</span>
            </button>
          )}

          {/* Logout always visible */}
          <button
            className={`nav-btn logout ${isActive("/logout") ? "active" : ""}`}
            onClick={() => setShowLogoutModal(true)}
          >
            <FaSignOutAlt className="icon" />
            <span className="nav-text"> LOGOUT</span>
            <span className="tooltip-text">Logout</span>
          </button>
        </nav>
      </aside>

      <main className="main-panel flex-grow-1 p-4">
        <div className="dashboard-header d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <button
              className="toggle-sidebar btn d-lg-none me-0"
              onClick={toggleSidebar}
            >
              {isSidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <h2 className="fs-1 fw-bold m-0">{title}</h2>
          </div>
          {showSearch && (
            <div className="search-bar position-relative me-3">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <FaSearch className="search-icon" />
            </div>
          )}
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

export default AdminLayout;
