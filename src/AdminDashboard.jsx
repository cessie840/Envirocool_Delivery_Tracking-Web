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
  FaTruck,
} from "react-icons/fa";
import { Row, Col, Card } from "react-bootstrap";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

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

  const [yearlyData, setYearlyData] = useState({ total: 0, distribution: [] });
  const [transactionStatusData, setTransactionStatusData] = useState([]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

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
        }
      })
      .catch((err) =>
        console.error("Error fetching recent transactions:", err)
      );

    // Fetch pending transactions
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
        }
      })
      .catch((err) =>
        console.error("Error fetching pending transactions:", err)
      );

    axios
      .get(
        "http://localhost/DeliveryTrackingSystem/get_yearly_distribution.php",
        { withCredentials: true }
      )
      .then((res) => {
        if (res.data.success) setYearlyData(res.data);
      })
      .catch((err) =>
        console.error("Error fetching yearly distribution:", err)
      );

    axios
      .get(
        "http://localhost/DeliveryTrackingSystem/get_monthly_transactions.php",
        { withCredentials: true }
      )
      .then((res) => {
        if (res.data.success) setTransactionStatusData(res.data.monthly);
      })
      .catch((err) =>
        console.error("Error fetching monthly transactions:", err)
      );
  }, []);

  const handleAddDelivery = () => navigate("/add-delivery");

  const iconStyle = {
    color: "white",
    fontSize: "1.3rem",
    padding: "10px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    marginRight: "10px",
  };

  const COLORS = ["#4CAF50", "#E57373"];

  return (
    <AdminLayout
      title="Dashboard"
      showSearch={false}
      onAddClick={handleAddDelivery}
    >
      <div className="container-fluid">
        {/* Top 4 Cards */}
        <Row className="mb-4 g-3">
          <Col xl={3} lg={6} md={6} sm={12}>
            <Card className="p-3 shadow-sm h-100">
              <div className="d-flex align-items-center">
                <div style={{ ...iconStyle, backgroundColor: "#2196F3" }}>
                  <FaTruck />
                </div>
                <div>
                  <h6 className="fw-semibold m-0">Total Transactions</h6>
                  <p className="mb-0 fw-semibold small">
                    {dashboardCounts.total}
                  </p>
                </div>
              </div>
            </Card>
          </Col>

          <Col xl={3} lg={6} md={6} sm={12}>
            <Card className="p-3 shadow-sm h-100">
              <div className="d-flex align-items-center">
                <div style={{ ...iconStyle, backgroundColor: "#4CAF50" }}>
                  <FaCheckCircle />
                </div>
                <div>
                  <h6 className="fw-semibold m-0">Successful</h6>
                  <p className="mb-0 fw-semibold small">
                    {dashboardCounts.successful}
                  </p>
                </div>
              </div>
            </Card>
          </Col>

          <Col xl={3} lg={6} md={6} sm={12}>
            <Card className="p-3 shadow-sm h-100">
              <div className="d-flex align-items-center">
                <div style={{ ...iconStyle, backgroundColor: "#E57373" }}>
                  <FaTimesCircle />
                </div>
                <div>
                  <h6 className="fw-semibold m-0">Cancelled</h6>
                  <p className="mb-0 fw-semibold small">
                    {dashboardCounts.cancelled}
                  </p>
                </div>
              </div>
            </Card>
          </Col>

          <Col xl={3} lg={6} md={6} sm={12}>
            <Card className="p-3 shadow-sm h-100">
              <div className="d-flex align-items-center">
                <div style={{ ...iconStyle, backgroundColor: "#FFC107" }}>
                  <FaClock />
                </div>
                <div>
                  <h6 className="fw-semibold m-0">Outgoing</h6>
                  <p className="mb-0 fw-semibold small">
                    {dashboardCounts.pending}
                  </p>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Bottom Panels */}
        <Row className="g-3">
          {/* Recent Transactions */}
          <Col lg={7} md={12}>
            <div className="dashboard-panel bg-white p-4 h-100 shadow-sm">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="m-0 fw-bold">Recent Transactions</h5>
                <div className="d-flex gap-3">
                  <FaSearch className="text-secondary cursor-pointer" />
                </div>
              </div>

              <div className="table-responsive">
                <table
                  className="table table-bordered table-hover responsive shadow-sm text-center mb-0"
                  style={{ cursor: "default" }}
                >
                  <thead className="table-success">
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
                        <tr key={tx.transaction_id} className="table-row-hover">
                          <td>#{tx.transaction_id}</td>
                          <td>{tx.customer_name}</td>
                          <td>{formatDate(tx.date_ordered)}</td>
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

          {/* Pending Transactions (no Status column) */}
          <Col lg={5} md={12}>
            <div className="dashboard-panel bg-white p-4 h-100 shadow-sm">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="m-0 fw-bold">Pending Transactions</h5>
                <div className="d-flex gap-3">
                  <FaSearch className="text-secondary cursor-pointer" />
                </div>
              </div>

              <div className="table-responsive">
                <table
                  className="table table-bordered table-hover responsive shadow-sm text-center mb-0"
                  style={{ cursor: "default" }}
                >
                  <thead className="table-success">
                    <tr>
                      <th>Transaction No.</th>
                      <th>Client</th>
                      <th>Date Ordered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingTransactions.length > 0 ? (
                      pendingTransactions.map((tx) => (
                        <tr key={tx.transaction_id} className="table-row-hover">
                          <td>#{tx.transaction_id}</td>
                          <td>{tx.customer_name}</td>
                          <td>{formatDate(tx.date_ordered)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center text-muted">
                          No pending transactions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="text-muted small mt-2">
                Showing {pendingTransactions.length} pending transactions out of{" "}
                {dashboardCounts.pending}
              </div>
            </div>
          </Col>
        </Row>

        <Row className="mt-4 g-3">
          {/* Left: Monthly Bar Chart */}
          <Col lg={8} md={12}>
            <div className="dashboard-panel bg-white p-4 shadow-sm h-100">
              <h5 className="fw-bold mb-3">
                Monthly Transactions (Year {yearlyData.year})
              </h5>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={transactionStatusData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#2196F3" name="Transactions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Col>

          {/* Right: Yearly Distribution Pie Chart */}
          <Col lg={4} md={12}>
            <div className="dashboard-panel bg-white p-4 shadow-sm h-100">
              <h5 className="fw-bold mb-3">
                Successful vs Cancelled (Year {yearlyData.year})
              </h5>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={yearlyData.distribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, value }) =>
                      `${name}: ${value} (${(
                        (value / yearlyData.total) *
                        100
                      ).toFixed(1)}%)`
                    }
                    labelLine={false}
                  >
                    {yearlyData.distribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} transactions`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-muted small mt-2 fw-bold">
                Total: {yearlyData.total} transactions
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
