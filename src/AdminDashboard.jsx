import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaListAlt,
  FaEquals,
  FaSearch,
} from "react-icons/fa";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Row, Col, Card } from "react-bootstrap";
import axios from "axios";

ChartJS.register(ArcElement, Tooltip, Legend);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [dashboardCounts, setDashboardCounts] = useState({
    total: 0,
    successful: 0,
    cancelled: 0,
    pending: 0,
  });

  useEffect(() => {
    document.title = "Admin Dashboard";

    // Fetch dashboard totals
    axios
      .get("http://localhost/DeliveryTrackingSystem/get_total_dashboard.php", {
        withCredentials: true,
      })
      .then((res) => {
        if (res.data.success) {
          setDashboardCounts(res.data);
        } else {
          console.error("Failed to fetch dashboard data:", res.data.message);
        }
      })
      .catch((err) => console.error("Error fetching dashboard data:", err));

    // Fetch recent transactions
    axios
      .get(
        "http://localhost/DeliveryTrackingSystem/get_recent_transactions.php",
        {
          withCredentials: true,
        }
      )
      .then((res) => {
        if (res.data.success) {
          setRecentTransactions(res.data.transactions);
        } else {
          console.error(
            "Failed to fetch recent transactions:",
            res.data.message
          );
        }
      })
      .catch((err) =>
        console.error("Error fetching recent transactions:", err)
      );

    // Fetch pending transactions with full URL
    axios
      .get(
        "http://localhost/DeliveryTrackingSystem/get_pending_transactions.php",
        {
          withCredentials: true,
        }
      )
      .then((res) => {
        if (res.data.success) {
          setPendingTransactions(res.data.transactions);
        } else {
          console.error(
            "Failed to fetch pending transactions:",
            res.data.message
          );
        }
      })
      .catch((err) =>
        console.error("Error fetching pending transactions:", err)
      );
  }, []);

  const handleAddDelivery = () => navigate("/add-delivery");

  const iconStyle = {
    color: "white",
    fontSize: "1.5rem",
    padding: "10px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    marginRight: "10px",
  };

  return (
    <AdminLayout
      title="Dashboard"
      showSearch={false}
      onAddClick={handleAddDelivery}
    >
      <div className="container">
        {/* Top 4 Cards */}
        <Row className="mb-4">
          <Col md={3} sm={6} xs={12}>
            <Card className="p-3 mb-3 shadow-sm">
              <div className="d-flex align-items-center">
                <div style={{ ...iconStyle, backgroundColor: "#673AB7" }}>
                  <FaListAlt />
                </div>
                <div>
                  <h6 className="fw-semibold">Total Transactions</h6>
                  <p className="mb-0 fw-semibold">{dashboardCounts.total}</p>
                </div>
              </div>
            </Card>
          </Col>

          <Col md={3} sm={6} xs={12}>
            <Card className="p-3 mb-3 shadow-sm">
              <div className="d-flex align-items-center">
                <div style={{ ...iconStyle, backgroundColor: "#4CAF50" }}>
                  <FaCheckCircle />
                </div>
                <div>
                  <h6 className="fw-semibold">Successful</h6>
                  <p className="mb-0 fw-semibold">
                    {dashboardCounts.successful}
                  </p>
                </div>
              </div>
            </Card>
          </Col>

          <Col md={3} sm={6} xs={12}>
            <Card className="p-3 mb-3 shadow-sm">
              <div className="d-flex align-items-center">
                <div style={{ ...iconStyle, backgroundColor: "#F44336" }}>
                  <FaTimesCircle />
                </div>
                <div>
                  <h6 className="fw-semibold">Cancelled</h6>
                  <p className="mb-0 fw-semibold">
                    {dashboardCounts.cancelled}
                  </p>
                </div>
              </div>
            </Card>
          </Col>

          <Col md={3} sm={6} xs={12}>
            <Card className="p-3 mb-3 shadow-sm">
              <div className="d-flex align-items-center">
                <div style={{ ...iconStyle, backgroundColor: "#FFC107" }}>
                  <FaClock />
                </div>
                <div>
                  <h6 className="fw-semibold">Outgoing</h6>
                  <p className="mb-0 fw-semibold">{dashboardCounts.pending}</p>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Bottom Panels */}
        <Row>
          {/* Recent Transactions */}
          <Col lg={8} md={12} className="mb-3">
            <div className="dashboard-panel bg-white p-4 h-100 shadow-sm">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="m-0">Recent Transactions</h5>
                <div className="d-flex gap-3">
                  <FaEquals className="text-secondary cursor-pointer" />
                  <FaSearch className="text-secondary cursor-pointer" />
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-striped table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Transaction No.</th>
                      <th>Client</th>
                      <th>Date Ordered</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.length > 0 ? (
                      recentTransactions.map((tx) => (
                        <tr key={tx.transaction_id}>
                          <td>#{tx.transaction_id}</td>
                          <td>{tx.customer_name}</td>
                          <td>{tx.date_ordered}</td>
                          <td>
                            {tx.status === "Delivered" && (
                              <span className="badge bg-success">
                                Successful
                              </span>
                            )}
                            {tx.status === "Cancelled" && (
                              <span className="badge bg-danger">Cancelled</span>
                            )}
                            {tx.status === "Out for Delivery" && (
                              <span className="badge bg-warning text-dark">
                                Out for Delivery
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center text-muted">
                          No recent transactions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="text-muted small mt-2">
                Showing {recentTransactions.length} recent transactions out of{" "}
                {dashboardCounts.total}
              </div>
            </div>
          </Col>

          {/* Pending Transactions */}
          <Col lg={4} md={12} className="mb-3">
            <div className="dashboard-panel bg-white p-4 h-100 shadow-sm">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="m-0">Pending Transactions</h5>
                <div className="d-flex gap-3">
                  <FaEquals className="text-secondary cursor-pointer" />
                  <FaSearch className="text-secondary cursor-pointer" />
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-striped table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Transaction No.</th>
                      <th>Client</th>
                      <th>Date Ordered</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingTransactions.length > 0 ? (
                      pendingTransactions.map((tx) => (
                        <tr key={tx.transaction_id}>
                          <td>#{tx.transaction_id}</td>
                          <td>{tx.customer_name}</td>
                          <td>{tx.date_ordered}</td>
                          <td>
                            <span className="badge bg-warning text-dark">
                              Pending
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center text-muted">
                          No pending transactions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="text-muted small mt-2">
                Showing {pendingTransactions.length} pending transactions
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
