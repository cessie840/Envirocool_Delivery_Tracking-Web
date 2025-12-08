import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "./UserContext";
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
  FaUserShield,
} from "react-icons/fa";
import { Modal, Button } from "react-bootstrap";
import axios from "axios";
import "./loading-overlay.css";

const AdminLayout = ({
  title,
  onAddClick,
  showSearch = true,
  onSearch,
  children,
}) => {
  const { user, setUser } = useContext(UserContext);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    () => localStorage.getItem("sidebarCollapsed") === "true"
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => window.innerWidth > 991
  );

  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  // Load logged-in user's permissions from backend if not already present
  useEffect(() => {
    const fetchUserPermissions = async () => {
      if (!user) return;
      if (!user.permissions) {
        try {
          const res = await axios.post(
            "http://localhost/DeliveryTrackingSystem/get_user_permissions.php",
            {
              username: user.username,
              role: user.role,
            }
          );
          if (res.data.success) {
            const updatedUser = {
              ...user,
              permissions: res.data.permissions || {},
            };
            setUser(updatedUser);
            setPermissions(updatedUser.permissions);
            localStorage.setItem("user", JSON.stringify(updatedUser));
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        setPermissions(user.permissions);
      }
    };
    fetchUserPermissions();
  }, [user, setUser]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleCollapse = () => setIsSidebarCollapsed(!isSidebarCollapsed);
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) onSearch(value);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      localStorage.removeItem("user");
      setUser(null);
      navigate("/");
    }, 500);
  };

  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth > 991);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  // Sidebar buttons config
  const navButtons = [
    {
      permission: "AdminDashboard",
      icon: <FaHome />,
      text: "DASHBOARD",
      path: "/admin-dashboard",
    },
    {
      permission: "AdminDeliveryDetails",
      icon: <FaClipboardList />,
      text: "DELIVERY DETAILS",
      path: "/delivery-details",
    },
    {
      permission: "AdminMonitorDelivery",
      icon: <FaTruck />,
      text: "MONITOR DELIVERY",
      path: "/monitor-delivery",
    },
    {
      permission: "AdminGenerateReport",
      icon: <FaChartBar />,
      text: "DATA ANALYTICS & REPORT",
      path: "/generate-report",
    },
    {
      permission: "CreatePersonnelAccount",
      icon: <FaUserFriends />,
      text: "DELIVERY PERSONNEL ACCOUNTS",
      path: "/user-management",
    },
    {
      permission: "SystemAdminRolesAndPermission",
      icon: <FaUserShield />,
      text: "USER ROLES AND PERMISSION",
      path: "/roles-permission",
    },
    {
      permission: "AdminSettings",
      icon: <FaCog />,
      text: "SETTINGS",
      path: "/admin-settings",
    },
  ];

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
          <img src={logo} alt="Logo" className="logo img-fluid" width="250px" />
          <button
            className="btn collapse-toggle d-none d-lg-flex p-3"
            onClick={toggleCollapse}
          >
            {isSidebarCollapsed ? <FaAlignJustify /> : <FaAlignRight />}
          </button>
        </div>

        <nav className="nav-buttons w-100">
          {navButtons.map(
            (btn) =>
              permissions[btn.permission] && (
                <button
                  key={btn.permission}
                  className={`nav-btn ${isActive(btn.path) ? "active" : ""}`}
                  onClick={() => navigate(btn.path)}
                >
                  {btn.icon}
                  {!isSidebarCollapsed && (
                    <span className="nav-text">{btn.text}</span>
                  )}
                  <span className="tooltip-text">{btn.text}</span>
                </button>
              )
          )}
          <button
            className="nav-btn logout"
            onClick={() => setShowLogoutModal(true)}
          >
            <FaSignOutAlt className="icon" />
            <span className="nav-text">LOGOUT</span>
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
