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
  FaTimes, FaArrowLeft 
} from "react-icons/fa";

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const navigate = useNavigate();

  const [orderDetails, setOrderDetails] = useState({
    customerName: "Daniel Padila",
    customerAddress: "123 Main St",
    contactNumber: "09123456789",
    paymentMode: "Cash On Delivery",
    items: [
      {
        name: "Samsung S-Inverter Split Type Aircon",
        quantity: 4,
        price: 6000,
      },
    ],
    totalCost: 20000,
  });

  const handleAddDelivery = () => navigate("/add-delivery");
  const handleDashboard = () => navigate("/admin-dashboard");
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
            <h2 className="fs-1 fw-bold m-0">View Order Details</h2>
          </div>

          {/* SEARCH BAR */}
          <div className="search-bar position-relative me-3">
            <input type="text" placeholder="Search..." />
            <FaSearch className="search-icon" />
          </div>
        </div>

        {/* ADD DELIVERY BUTTON  */}
        <div className="d-flex justify-content-between mx-4 my-5">
          <button
            className="back btn rounded-2 px-1 py-1 fs-4"
            onClick={() => navigate(-1)} 
          >
            <FaArrowLeft className="me-2" />
          </button>

          <button
            className="add-delivery rounded-2 px-5 py-2 fs-5 rounded-3"
            onClick={handleAddDelivery}
          >
            Add Delivery
          </button>
        </div>
        {/* DASHBOARD CONTENT  */}
        <div className="container mt-5 w-75">
          <div className="card shadow-lg border-0 rounded-4">
            <div className="card-body">
              <h2 className="card-title text-center fw-bold text-success">
                Transaction No. 000000001
              </h2>
              <hr />

              {/* Customer Details */}
              <div className="mb-3 p-3 bg-light border rounded-3 shadow-sm">
                <h5 className="text-success">Customer Details</h5>
                <p>
                  <strong>Name:</strong> {orderDetails.customerName}
                </p>
                <p>
                  <strong>Address:</strong> {orderDetails.customerAddress}
                </p>
                <p>
                  <strong>Contact:</strong> {orderDetails.contactNumber}
                </p>
                <p>
                  <strong>Payment Mode:</strong> {orderDetails.paymentMode}
                </p>
              </div>

              {/* Items Ordered */}
              <div className="mb-3 p-3 bg-light border rounded-3 shadow-sm">
                <h5 className="text-success">Items Ordered</h5>
                <ul className="list-group list-group-flush">
                  {orderDetails.items.map((item, index) => (
                    <li
                      key={index}
                      className="list-group-item d-flex justify-content-between"
                    >
                      <span>
                        {item.name} x{item.quantity}
                      </span>
                      <span className="fw-bold">₱{item.price}</span>
                    </li>
                  ))}
                </ul>
                 <div className="text-end mt-4">
                <h4 className="fw-bold text-success m-3">
                  Total Cost: ₱{orderDetails.totalCost}
                </h4>
              </div>
              </div>

              {/* Total Cost */}
             
              <div className="buttons d-flex justify-content-center gap-5 mt-5">
                <button className="add-btn bg-success px-5 rounded-3 border border-2">Update</button>
                <button className="cancel-btn bg-danger px-5 rounded-3 border border-2">Delete</button>

              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
