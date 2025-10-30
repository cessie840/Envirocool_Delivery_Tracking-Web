import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaFileInvoice,
  FaSearch,
  FaQuestionCircle,
} from "react-icons/fa";
import { Row, Col, Card, Modal, Collapse } from "react-bootstrap";
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


import { HiQuestionMarkCircle } from "react-icons/hi";

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
  const [showFAQ, setShowFAQ] = useState(false);

  const [activeFAQIndex, setActiveFAQIndex] = useState(null);

  const guideqst = [
    {
      question: "How can I add a new delivery?",
      answer:
        "Click the 'Add Delivery' button at the top right or navigate to the Add Delivery page to input transaction details.",
    },
    {
      question: "Where can I view all the transaction records?",
      answer:
        "On the right side, you can see the sidebar. Click 'Delivery Details' to view all transaction records.",
    },
    {
      question: "Where can I track the deliveries?",
      answer:
        "On the right side, you can see the sidebar. Click 'Monitor Delivery' in the navigation drawer to track deliveries.",
    },
    {
      question: "Where can I find the delivery analytics?",
      answer:
        "On the right side, you can see the sidebar. Click 'Data Analytics & Reports' to access delivery analytics.",
    },
    {
      question: "What does the Monthly Transaction graph show?",
      answer: "It represents all the transaction records for each month.",
    },
    {
      question: "What is the pie chart for?",
      answer:
        "It represents the percentage of successful and cancelled deliveries.",
    },
  ];

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

    axios
      .get("http://localhost/DeliveryTrackingSystem/get_total_dashboard.php", {
        withCredentials: true,
      })
      .then((res) => {
        if (res.data.success) setDashboardCounts(res.data);
      })
      .catch((err) => console.error("Error fetching dashboard data:", err));

    axios
      .get(
        "http://localhost/DeliveryTrackingSystem/get_recent_transactions.php",
        {
          withCredentials: true,
        }
      )
      .then((res) => {
        if (res.data.success) setRecentTransactions(res.data.transactions);
      })
      .catch((err) =>
        console.error("Error fetching recent transactions:", err)
      );

    axios
      .get(
        "http://localhost/DeliveryTrackingSystem/get_pending_transactions.php",
        {
          withCredentials: true,
        }
      )
      .then((res) => {
        if (res.data.success) setPendingTransactions(res.data.transactions);
      })
      .catch((err) =>
        console.error("Error fetching pending transactions:", err)
      );

    axios
      .get(
        "http://localhost/DeliveryTrackingSystem/get_yearly_distribution.php",
        {
          withCredentials: true,
        }
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
        {
          withCredentials: true,
        }
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
      title={
        <div className="d-flex align-items-center gap-2">
          <span>Dashboard</span>
          <HiQuestionMarkCircle
            style={{
              fontSize: "2rem",
              color: "#07720885",
              cursor: "pointer",
              marginLeft: "10px",
            }}
            onClick={() => setShowFAQ(true)}
          />
        </div>
      }
      showSearch={false}
      onAddClick={handleAddDelivery}
    >
      <div className="container-fluid">
        {/* ===================== TOP 4 CARDS ===================== */}
        <Row className="mb-4 g-3">
          <Col xl={3} lg={6} md={6} sm={12}>
            <Card className="p-3 h-100 dashboard-panel">
              <div className="d-flex align-items-center">
                <div style={{ ...iconStyle, backgroundColor: "#2196F3" }}>
                  <FaFileInvoice />
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
            <Card className="p-3 h-100 dashboard-panel">
              <div className="d-flex align-items-center">
                <div style={{ ...iconStyle, backgroundColor: "#4CAF50" }}>
                  <FaCheckCircle />
                </div>
                <div>
                  <h6 className="fw-semibold m-0">Successful Deliveries</h6>
                  <p className="mb-0 fw-semibold small">
                    {dashboardCounts.successful}
                  </p>
                </div>
              </div>
            </Card>
          </Col>

          <Col xl={3} lg={6} md={6} sm={12}>
            <Card className="p-3 h-100 dashboard-panel">
              <div className="d-flex align-items-center">
                <div style={{ ...iconStyle, backgroundColor: "#E57373" }}>
                  <FaTimesCircle />
                </div>
                <div>
                  <h6 className="fw-semibold m-0">Rescheduled Deliveries</h6>
                  <p className="mb-0 fw-semibold small">
                    {dashboardCounts.cancelled}
                  </p>
                </div>
              </div>
            </Card>
          </Col>

          <Col xl={3} lg={6} md={6} sm={12}>
            <Card className="p-3 h-100 dashboard-panel">
              <div className="d-flex align-items-center">
                <div style={{ ...iconStyle, backgroundColor: "#FFC107" }}>
                  <FaClock />
                </div>
                <div>
                  <h6 className="fw-semibold m-0">Outgoing Deliveries</h6>
                  <p className="mb-0 fw-semibold small">
                    {dashboardCounts.pending}
                  </p>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* ===================== RECENT + PENDING TABLES ===================== */}
        <Row className="g-3">
          {/* Recent Transactions */}
          <Col lg={7} md={12}>
            <div className="dashboard-panel bg-white p-4 h-100 shadow-sm border border-light">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="m-0 fw-bold">Recent Transactions</h5>
                <FaSearch className="text-secondary cursor-pointer" />
              </div>

              <div className="table-responsive">
                <table className="table table-bordered table-hover text-center mb-0">
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
                        <tr key={tx.transaction_id}>
                          <td>{tx.transaction_id}</td>
                          <td>{tx.customer_name}</td>
                          <td>{formatDate(tx.date_ordered)}</td>
                          <td>
                            <span
                              style={{
                                backgroundColor:
                                  tx.status === "Delivered"
                                    ? "#C6FCD3"
                                    : tx.status === "Cancelled"
                                    ? "#FDE0E0"
                                    : tx.status === "Out for Delivery"
                                    ? "#D2E6F5"
                                    : "transparent",
                                color:
                                  tx.status === "Delivered"
                                    ? "#3E5F44"
                                    : tx.status === "Cancelled"
                                    ? "red"
                                    : "#1762B1",
                                padding: "5px 8px",
                                borderRadius: "8px",
                                fontSize: "0.85rem",
                                fontWeight: "600",
                              }}
                            >
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-muted text-center">
                          No recent transactions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Col>

          {/* Pending Transactions */}
          <Col lg={5} md={12}>
            <div className="dashboard-panel bg-white p-4 h-100 shadow-sm border border-light">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="m-0 fw-bold">Pending Transactions</h5>
                <FaSearch className="text-secondary cursor-pointer" />
              </div>

              <div className="table-responsive">
                <table className="table table-bordered table-hover text-center mb-0">
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
                        <tr key={tx.transaction_id}>
                          <td>{tx.transaction_id}</td>
                          <td>{tx.customer_name}</td>
                          <td>{formatDate(tx.date_ordered)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-muted text-center">
                          No pending transactions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Col>
        </Row>

        {/* ===================== CHARTS ===================== */}
        <Row className="mt-4 g-3">
          {/* Monthly Bar Chart */}
          <Col xs={12} lg={8}>
            <div className="dashboard-panel bg-white p-4 shadow-sm h-100 border border-light">
              <h5 className="fw-bold mb-3">
                Monthly Transactions (Year {yearlyData.year})
              </h5>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={transactionStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="total"
                    fill="#2196F3"
                    name="Total Transactions"
                  />
                  <Bar
                    dataKey="successful"
                    fill="#4CAF50"
                    name="Successful Deliveries"
                  />
                  <Bar
                    dataKey="cancelled"
                    fill="#E57373"
                    name="Rescheduled Deliveries"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Col>

          {/* Pie Chart */}
          <Col xs={12} lg={4}>
            <div className="dashboard-panel bg-white p-4 shadow-sm h-100 border border-light">
              <h5 className="fw-bold mb-3">
                Successful vs Cancelled (Year {yearlyData.year})
              </h5>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={yearlyData.distribution}
                    dataKey="value"
                    nameKey="name"
                    outerRadius="70%"
                    labelLine={false}
                  >
                    {yearlyData.distribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center mt-2">
                {yearlyData.distribution.map((entry, i) => (
                  <div key={i}>
                    <span
                      style={{
                        display: "inline-block",
                        width: 15,
                        height: 15,
                        backgroundColor: COLORS[i % COLORS.length],
                        marginRight: 8,
                      }}
                    ></span>
                    {entry.name}: {entry.value} (
                    {((entry.value / yearlyData.total) * 100).toFixed(1)}%)
                  </div>
                ))}
              </div>
              <div className="text-muted small mt-2 fw-bold text-center">
                Total: {yearlyData.total} transactions
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* ===================== FAQ MODAL ===================== */}
      {/* FAQ MODAL */}
      <Modal
        show={showFAQ}
        onHide={() => {
          setShowFAQ(false);
          setActiveFAQIndex(null);
        }}
        centered
        dialogClassName="faq-modal-dialog"
      >
        <Modal.Header closeButton>
          <Modal.Title>Guide for Dashboard</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p className="px-3 text-justify">
            The Dashboard provides a quick overview of the transactions. You can
            see the total transactions, successful deliveries, rescheduled
            deliveries, and outgoing deliveries at a glance. The charts below
            help visualize monthly trends and compare successful vs cancelled
            deliveries.
          </p>

          <div className="px-3 mb-3">
            {guideqst.map((faq, index) => (
              <div key={index} className="mb-2">
                <button
                  className={`faq-btn w-100 text-start ${
                    activeFAQIndex === index ? "active" : ""
                  }`}
                  onClick={() =>
                    setActiveFAQIndex(activeFAQIndex === index ? null : index)
                  }
                >
                  {faq.question}
                </button>
                <Collapse in={activeFAQIndex === index}>
                  <div
                    className={`faq-answer ${
                      activeFAQIndex === index ? "" : "collapsing"
                    }`}
                  >
                    <strong>Answer:</strong>
                    <p className="mt-2 mb-0">{faq.answer}</p>
                  </div>
                </Collapse>
              </div>
            ))}
          </div>
        </Modal.Body>

        <Modal.Footer>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => {
              setShowFAQ(false);
              setActiveFAQIndex(null);
            }}
          >
            Close
          </button>
        </Modal.Footer>
      </Modal>
    </AdminLayout>
  );
};

export default AdminDashboard;
