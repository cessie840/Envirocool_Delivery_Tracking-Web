import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import {
  FaPlus,
  FaFilePdf,
  FaFilter,
  FaDollarSign,
  FaUsers,
  FaBoxes,
  FaClipboardList,
  FaCheckCircle,
  FaTimesCircle,
  FaTruck,
} from "react-icons/fa";
import {
  Modal,
  Button,
  Form,
  Table,
  Row,
  Col,
  Spinner,
  Card,
} from "react-bootstrap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const REPORT_TYPES = [
  { value: "sales", label: "Sales Report" },
  { value: "transaction", label: "Transaction Report" },
  { value: "service", label: "Service Delivery Report" },
  { value: "customer", label: "Customer Satisfaction Report" },
  { value: "all", label: "Overall Reports" },
];

const PERIODS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" },
];

const COLORS = ["#4CAF50", "#E57373", "#FFC107", "#2196F3", "#9C27B0"];

const GenerateReport = () => {
  const navigate = useNavigate();
  const reportRef = useRef(null);

  // Filter modal state
  const [showFilter, setShowFilter] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [period, setPeriod] = useState("monthly");
  const [reportType, setReportType] = useState("all");

  // Data states
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({});
  const [salesData, setSalesData] = useState([]);
  const [topSelling, setTopSelling] = useState([]);
  const [transactionData, setTransactionData] = useState([]);
  const [serviceData, setServiceData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [deliveryStatus, setDeliveryStatus] = useState("");
  const [deliveryPersonnel, setDeliveryPersonnel] = useState("");
  const [cancellationReasonFilter, setCancellationReasonFilter] = useState("");
  const [deliveryPersonnelOptions, setDeliveryPersonnelOptions] = useState([]);
  const [cancellationReasonOptions, setCancellationReasonOptions] = useState(
    []
  );

  const salesRef = useRef(null);
  const transactionRef = useRef(null);
  const serviceRef = useRef(null);
  const customerRef = useRef(null);

  const [salesPage, setSalesPage] = useState(1);
  const [transactionPage, setTransactionPage] = useState(1);
  const [servicePage, setServicePage] = useState(1);
  const [customerPage, setCustomerPage] = useState(1);

  const [activeTab, setActiveTab] = useState("overall");

  // Fetch data based on filters
  useEffect(() => {
    fetchData();
  }, [startDate, endDate, period, reportType]);

  useEffect(() => {
    // console logs removed for brevity
  }, [salesData, topSelling, transactionData, serviceData, customerData]);

  useEffect(() => {
    if (activeTab === "overall") {
      setSalesPage(1);
      setTransactionPage(1);
      setServicePage(1);
      setCustomerPage(1);
    }
  }, [activeTab]);

  // Normalizers (defensive)
  const normalizeSales = (raw = []) =>
    (Array.isArray(raw) ? raw : []).map((r) => ({
      date: r.date ? new Date(r.date).toISOString().slice(0, 10) : null,
      customer_name: r.customer_name ?? r.customer ?? "Unknown",
      item_name: r.item_name ?? r.description ?? "-",
      qty: Number(r.qty ?? r.quantity ?? 0),
      unit_cost: Number(r.unit_cost ?? r.unit_price ?? 0),
      total_cost: Number(r.total_cost ?? r.total ?? 0),
    }));

  const normalizeTopSelling = (raw = []) =>
    (Array.isArray(raw) ? raw : []).map((r) => ({
      item_name: r.item_name ?? r.name ?? "Unknown",
      quantity_sold: Number(r.quantity_sold ?? r.qty ?? r.count ?? 0),
    }));

  const normalizeTransactions = (raw = []) =>
    (Array.isArray(raw) ? raw : []).map((r) => ({
      transaction_id: r.transaction_id ?? r.id ?? null,
      customer_name: r.customer_name ?? r.customer ?? "Unknown",
      customer_address: r.customer_address ?? r.address ?? "-",
      customer_contact: r.customer_contact ?? r.contact ?? "-",
      date_of_order: r.date_of_order
        ? new Date(r.date_of_order).toISOString().slice(0, 10)
        : r.date
        ? new Date(r.date).toISOString().slice(0, 10)
        : null,
      item_name: r.item_name ?? r.description ?? "-",
      qty: Number(r.qty ?? r.quantity ?? 0),
      total_cost: Number(r.total_cost ?? r.total ?? 0),
      mode_of_payment: r.mode_of_payment ?? r.payment ?? "-",
      delivery_status: r.delivery_status ?? r.status ?? "Pending",
      shipout_at: r.shipout_at
        ? new Date(r.shipout_at).toISOString().slice(0, 10)
        : null,
      completed_at: r.completed_at
        ? new Date(r.completed_at).toISOString().slice(0, 10)
        : null,
      cancelled_reason: r.cancelled_reason ?? r.cancellation_reason ?? null,
      delivery_personnel: r.delivery_personnel ?? r.delivery_person ?? "-", // new field
    }));

  const normalizeService = (raw = []) =>
    (Array.isArray(raw) ? raw : []).map((r) => ({
      date: r.date ? new Date(r.date).toISOString().slice(0, 10) : null,
      customer_name: r.customer_name ?? r.customer ?? "Unknown",
      item_name: r.item_name ?? r.description ?? "-",
      delivery_status: r.delivery_status ?? r.status ?? "Pending",
      cancelled_reason: r.cancelled_reason ?? r.cancellation_reason ?? null,
    }));

  const normalizeCustomer = (raw = []) =>
    (Array.isArray(raw) ? raw : []).map((r) => ({
      date: r.date ? new Date(r.date).toISOString().slice(0, 10) : null,
      customer_name: r.customer_name ?? r.customer ?? "Unknown",
      item_name: r.item_name ?? r.description ?? "-",
      customer_rating:
        r.customer_rating != null ? Number(r.customer_rating) : null,
      delivery_status: r.delivery_status ?? r.status ?? "Pending",
      cancelled_reason: r.cancelled_reason ?? r.cancellation_reason ?? null,
    }));

  const safeJson = async (res) => {
    try {
      const json = await res.json();
      // console.debug("API response:", json);
      return json;
    } catch (err) {
      console.error("JSON parse error", err);
      return {};
    }
  };

  const buildUrl = (endpoint) => {
    let url = `${endpoint}?period=${period}`;
    if (startDate && endDate) {
      url += `&start=${startDate}&end=${endDate}`;
    }
    return url;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (reportType === "sales" || reportType === "all") {
        const res = await fetch(
          buildUrl(
            "http://localhost/DeliveryTrackingSystem/get_sales_report.php"
          )
        );
        if (!res.ok) throw new Error("get_sales_report failed");
        const data = await safeJson(res);
        setSalesData(normalizeSales(data.sales ?? []));
        setTopSelling(normalizeTopSelling(data.topSelling ?? []));
        if (reportType === "sales") setSummary(data.summary ?? {});
      }

      if (reportType === "transaction" || reportType === "all") {
        const res = await fetch(
          buildUrl(
            "http://localhost/DeliveryTrackingSystem/get_transaction_report.php"
          )
        );
        if (!res.ok) throw new Error("get_transaction_report failed");
        const data = await safeJson(res);
        const normalizedTransactions = normalizeTransactions(
          data.transactions ?? []
        );
        setTransactionData(normalizedTransactions);
        setSummary((prev) =>
          reportType === "transaction"
            ? data.summary ?? {}
            : reportType === "all"
            ? { ...prev, transactionSummary: data.summary ?? {} }
            : prev
        );

        // Extract unique delivery personnel for dropdown
        const personnelSet = new Set();
        normalizedTransactions.forEach((t) => {
          if (t.delivery_personnel && t.delivery_personnel !== "-") {
            personnelSet.add(t.delivery_personnel);
          }
        });
        setDeliveryPersonnelOptions(Array.from(personnelSet).sort());
      }

      if (reportType === "service" || reportType === "all") {
        const res = await fetch(
          buildUrl(
            "http://localhost/DeliveryTrackingSystem/get_service_delivery_report.php"
          )
        );
        if (!res.ok) throw new Error("get_service_delivery_report failed");
        const data = await safeJson(res);
        const normalizedService = normalizeService(
          data.serviceDeliveries ?? data.data ?? []
        );
        setServiceData(normalizedService);
        setSummary((prev) =>
          reportType === "service"
            ? data.summary ?? {}
            : reportType === "all"
            ? { ...prev, serviceSummary: data.summary ?? {} }
            : prev
        );

        // Extract unique Reason for Cancellations for dropdown
        const reasonsSet = new Set();
        normalizedService.forEach((s) => {
          if (s.cancelled_reason) {
            reasonsSet.add(s.cancelled_reason);
          }
        });
        setCancellationReasonOptions(Array.from(reasonsSet).sort());
      }

      if (reportType === "customer" || reportType === "all") {
        const res = await fetch(
          buildUrl(
            "http://localhost/DeliveryTrackingSystem/get_customer_satisfaction_report.php"
          )
        );
        if (!res.ok) throw new Error("get_customer_satisfaction_report failed");
        const data = await safeJson(res);
        setCustomerData(
          normalizeCustomer(data.customerSatisfaction ?? data.data ?? [])
        );
        setSummary((prev) =>
          reportType === "customer"
            ? data.summary ?? {}
            : reportType === "all"
            ? { ...prev, customerSummary: data.summary ?? {} }
            : prev
        );
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setSalesData([]);
      setTopSelling([]);
      setTransactionData([]);
      setServiceData([]);
      setCustomerData([]);
      setDeliveryPersonnelOptions([]);
      setCancellationReasonOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper: format date for display
  const formatDate = (d) => {
    if (!d) return "";
    const dateObj = new Date(d);
    return dateObj.toLocaleDateString();
  };

  // Helper: format date for period filtering (used in totals)
  const isDateInPeriod = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const start = new Date(startDate);
    const end = new Date(endDate);

    switch (period) {
      case "daily":
        return (
          date.getFullYear() === start.getFullYear() &&
          date.getMonth() === start.getMonth() &&
          date.getDate() === start.getDate()
        );
      case "weekly": {
        const getWeekStart = (d) => {
          const dt = new Date(d);
          dt.setHours(0, 0, 0, 0);
          dt.setDate(dt.getDate() - dt.getDay());
          return dt;
        };
        const weekStart = getWeekStart(start);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return date >= weekStart && date <= weekEnd;
      }
      case "monthly":
        return (
          date.getFullYear() === start.getFullYear() &&
          date.getMonth() === start.getMonth()
        );
      case "quarterly": {
        const getQuarter = (d) => Math.floor(d.getMonth() / 3) + 1;
        return (
          date.getFullYear() === start.getFullYear() &&
          getQuarter(date) === getQuarter(start)
        );
      }
      case "annually":
        return date.getFullYear() === start.getFullYear();
      default:
        return false;
    }
  };

  // Calculate totals based on period filtering for Sales and Transaction reports
  const isValidDate = (d) => d instanceof Date && !isNaN(d);

  const filteredSalesData =
    isValidDate(new Date(startDate)) && isValidDate(new Date(endDate))
      ? salesData.filter((row) => {
          const rowDate = new Date(row.date);
          return rowDate >= new Date(startDate) && rowDate <= new Date(endDate);
        })
      : salesData;

  const filteredTransactionData =
    isValidDate(new Date(startDate)) && isValidDate(new Date(endDate))
      ? transactionData.filter((row) => {
          const rowDate = new Date(row.date_of_order || row.date);
          if (rowDate < new Date(startDate) || rowDate > new Date(endDate))
            return false;

          if (
            deliveryStatus &&
            row.delivery_status.toLowerCase() !== deliveryStatus.toLowerCase()
          )
            return false;

          if (
            deliveryPersonnel &&
            !row.delivery_personnel
              .toLowerCase()
              .includes(deliveryPersonnel.toLowerCase())
          )
            return false;

          if (cancellationReasonFilter && row.cancelled_reason) {
            if (
              !row.cancelled_reason
                .toLowerCase()
                .includes(cancellationReasonFilter.toLowerCase())
            )
              return false;
          } else if (cancellationReasonFilter) {
            return false;
          }

          return true;
        })
      : transactionData.filter((row) => {
          if (
            deliveryStatus &&
            row.delivery_status.toLowerCase() !== deliveryStatus.toLowerCase()
          )
            return false;

          if (
            deliveryPersonnel &&
            !row.delivery_personnel
              .toLowerCase()
              .includes(deliveryPersonnel.toLowerCase())
          )
            return false;

          if (cancellationReasonFilter && row.cancelled_reason) {
            if (
              !row.cancelled_reason
                .toLowerCase()
                .includes(cancellationReasonFilter.toLowerCase())
            )
              return false;
          } else if (cancellationReasonFilter) {
            return false;
          }

          return true;
        });

  const filteredServiceData =
    isValidDate(new Date(startDate)) && isValidDate(new Date(endDate))
      ? serviceData.filter((row) => {
          const rowDate = new Date(row.date);
          if (rowDate < new Date(startDate) || rowDate > new Date(endDate))
            return false;

          if (cancellationReasonFilter && row.cancelled_reason) {
            if (
              !row.cancelled_reason
                .toLowerCase()
                .includes(cancellationReasonFilter.toLowerCase())
            )
              return false;
          } else if (cancellationReasonFilter) {
            return false;
          }

          return true;
        })
      : serviceData.filter((row) => {
          if (cancellationReasonFilter && row.cancelled_reason) {
            if (
              !row.cancelled_reason
                .toLowerCase()
                .includes(cancellationReasonFilter.toLowerCase())
            )
              return false;
          } else if (cancellationReasonFilter) {
            return false;
          }
          return true;
        });

const filteredCustomerData =
  isValidDate(new Date(startDate)) && isValidDate(new Date(endDate))
    ? customerData.filter((row) => {
        const rowDate = new Date(row.date);
        if (rowDate < new Date(startDate) || rowDate > new Date(endDate)) return false;

        // Only include delivered transactions
        if (String(row.delivery_status).toLowerCase() !== "delivered") return false;

        return true;
      })
    : customerData.filter((row) => {
        // Only include delivered transactions
        if (String(row.delivery_status).toLowerCase() !== "delivered") return false;
        return true;
      });


  // Totals for Sales report
  const totalSalesAmount = filteredSalesData.reduce(
    (acc, cur) => acc + (Number(cur.total_cost) || 0),
    0
  );
  const totalItemsSold = filteredSalesData.reduce(
    (acc, cur) => acc + (Number(cur.qty) || 0),
    0
  );
  const totalCustomersSales = new Set(
    filteredSalesData.map((row) => row.customer_name)
  ).size;

  // Totals for Transaction report
  const totalTransactions = filteredTransactionData.length;
  const totalCustomersTransaction = new Set(
    filteredTransactionData.map((row) => row.customer_name)
  ).size;
  const totalItemsTransaction = filteredTransactionData.reduce(
    (acc, cur) => acc + (Number(cur.qty) || 0),
    0
  );
  const totalSalesTransaction = filteredTransactionData.reduce(
    (acc, cur) => acc + (Number(cur.total_cost) || 0),
    0
  );

  // Totals for Service Delivery report
  const successfulDeliveries = filteredServiceData.filter(
    (row) => String(row.delivery_status).toLowerCase() === "delivered"
  ).length;
  const failedDeliveries = filteredServiceData.filter(
    (row) => String(row.delivery_status).toLowerCase() === "cancelled"
  ).length;
  const totalTransactionsService = filteredServiceData.length;

  // Failed delivery reasons counts for Service Delivery report
  const failedReasonsCount = { "Items Not Delivered": 0, "Damaged Item": 0 };

  filteredServiceData.forEach((row) => {
    const status = String(row.delivery_status).toLowerCase();
    if (status.includes("cancel") && row.cancelled_reason) {
      const reason = String(row.cancelled_reason).toLowerCase();

      // Check for all variants indicating item not delivered
      if (
        reason.includes("not delivered") ||
        reason.includes("not received") ||
        reason.includes("customer didn't receive") ||
        reason.includes("customer did not receive") ||
        reason.includes("didn't receive") ||
        reason.includes("did not receive") ||
        reason.includes("not received item") ||
        reason.includes("not received goods")
      ) {
        failedReasonsCount["Items Not Delivered"]++;
      } else if (reason.includes("damaged")) {
        failedReasonsCount["Damaged Item"]++;
      }
    }
  });

  // Customer satisfaction rating distribution (for pie chart)
  const ratingDistribution = filteredCustomerData.reduce((acc, cur) => {
    const rating = cur.customer_rating ?? "No Rating";
    const found = acc.find((a) => String(a.name) === String(rating));
    if (found) {
      found.value++;
    } else {
      acc.push({ name: rating, value: 1 });
    }
    return acc;
  }, []);

  // Sales growth line chart data (group sales by date)
  const salesGrowthData = filteredSalesData.reduce((acc, cur) => {
    const date = cur.date ?? "";
    const found = acc.find((a) => a.date === date);
    if (found) {
      found.total_cost =
        (Number(found.total_cost) || 0) + (Number(cur.total_cost) || 0);
    } else {
      acc.push({ date, total_cost: Number(cur.total_cost) || 0 });
    }
    return acc;
  }, []);

  // Transaction status data (Delivered vs Cancelled)
  const transactionStatusData = [
    {
      name: "Delivered",
      count: filteredTransactionData.filter(
        (row) => String(row.delivery_status).toLowerCase() === "delivered"
      ).length,
    },
    {
      name: "Cancelled",
      count: filteredTransactionData.filter(
        (row) => String(row.delivery_status).toLowerCase() === "cancelled"
      ).length,
    },
  ];

  // Cards styling and hover effect styles
  const cardStyle = {
    borderRadius: "0.75rem",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    marginBottom: "1.5rem",
  };
  const cardHoverStyle = {
    transform: "translateY(-5px)",
    boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
  };

  // State to track hover for cards (optional for subtle effect)
  const [hoveredCard, setHoveredCard] = useState(null);

  const iconStyle = {
    width: 40,
    height: 40,
    borderRadius: "50%",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
    fontSize: 20,
  };

  const renderTotalsCard = () => {
    if (reportType === "service" || reportType === "customer") return null;

    if (reportType === "transaction") {
      return (
        <Row className="mb-2">
          <Col md={3}>
            <Card
              className="card-total p-3 mb-4"
              style={{ backgroundColor: "white" }}
            >
              <div className="d-flex align-items-center">
                <div style={{ ...iconStyle, backgroundColor: "#4CAF50" }}>
                  <FaDollarSign />
                </div>
                <div>
                  <h6>Total Sales</h6>
                  <p className="mb-0">
                    ₱
                    {totalSalesTransaction.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </Card>
          </Col>
          <Col md={3}>
            <Card
              className="card-total p-3 mb-4"
              style={{ backgroundColor: "white" }}
            >
              <div className="d-flex align-items-center">
                <div style={{ ...iconStyle, backgroundColor: "#2196F3" }}>
                  <FaUsers />
                </div>
                <div>
                  <h6>Total Customers</h6>
                  <p className="mb-0">{totalCustomersTransaction}</p>
                </div>
              </div>
            </Card>
          </Col>
          <Col md={3}>
            <Card
              className="card-total p-3 mb-4"
              style={{ backgroundColor: "white" }}
            >
              <div className="d-flex align-items-center">
                <div style={{ ...iconStyle, backgroundColor: "#FF9800" }}>
                  <FaBoxes />
                </div>
                <div>
                  <h6>Total Items Sold</h6>
                  <p className="mb-0">{totalItemsTransaction}</p>
                </div>
              </div>
            </Card>
          </Col>
          <Col md={3}>
            <Card
              className="card-total p-3 mb-4"
              style={{ backgroundColor: "white" }}
            >
              <div className="d-flex align-items-center">
                <div style={{ ...iconStyle, backgroundColor: "#9C27B0" }}>
                  <FaClipboardList />
                </div>
                <div>
                  <h6>Total Transactions</h6>
                  <p className="mb-0">{totalTransactions}</p>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      );
    }

    if (reportType === "sales" || reportType === "all") {
      return (
        <Row className="mb-2">
          <Col md={4}>
            <Card
              className="card-total p-3 mb-4"
              style={{ backgroundColor: "white" }}
            >
              <div className="d-flex align-items-center">
                <div style={{ ...iconStyle, backgroundColor: "#4CAF50" }}>
                  <FaDollarSign />
                </div>
                <div>
                  <h6>Total Sales</h6>
                  <p className="mb-0">
                    ₱
                    {totalSalesAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </Card>
          </Col>
          <Col md={4}>
            <Card
              className="card-total p-3 mb-4"
              style={{ backgroundColor: "white" }}
            >
              <div className="d-flex align-items-center">
                <div style={{ ...iconStyle, backgroundColor: "#2196F3" }}>
                  <FaUsers />
                </div>
                <div>
                  <h6>Total Customers</h6>
                  <p className="mb-0">{totalCustomersSales}</p>
                </div>
              </div>
            </Card>
          </Col>
          <Col md={4}>
            <Card
              className="card-total p-3 mb-4"
              style={{ backgroundColor: "white" }}
            >
              <div className="d-flex align-items-center">
                <div style={{ ...iconStyle, backgroundColor: "#FF9800" }}>
                  <FaBoxes />
                </div>
                <div>
                  <h6>Total Items Sold</h6>
                  <p className="mb-0">{totalItemsSold}</p>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      );
    }

    return null;
  };

  // Render totals card for Service Delivery report
  const renderServiceTotalsCard = () => {
    if (reportType !== "service" && reportType !== "all") return null;
    if (serviceData.length === 0) return null;

    return (
      <Row className="mb-2">
        <Col md={4}>
          <Card
            className="card-total p-3 mb-2"
            style={{ backgroundColor: "white" }}
          >
            <div className="d-flex align-items-center">
              <div style={{ ...iconStyle, backgroundColor: "#4CAF50" }}>
                <FaCheckCircle />
              </div>
              <div>
                <h6>Successful Deliveries</h6>
                <p className="mb-0">{successfulDeliveries}</p>
              </div>
            </div>
          </Card>
        </Col>
        <Col md={4}>
          <Card
            className="card-total p-3 mb-2"
            style={{ backgroundColor: "white" }}
          >
            <div className="d-flex align-items-center">
              <div style={{ ...iconStyle, backgroundColor: "#E57373" }}>
                <FaTimesCircle />
              </div>
              <div>
                <h6>Failed Deliveries</h6>
                <p className="mb-0">{failedDeliveries}</p>
              </div>
            </div>
          </Card>
        </Col>
        <Col md={4}>
          <Card
            className="card-total p-3 mb-4"
            style={{ backgroundColor: "white" }}
          >
            <div className="d-flex align-items-center">
              <div style={{ ...iconStyle, backgroundColor: "#2196F3" }}>
                <FaTruck />
              </div>
              <div>
                <h6>Total Transactions</h6>
                <p className="mb-0">{totalTransactionsService}</p>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    );
  };

  // Render sales growth line chart
  const renderSalesGrowthChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={salesGrowthData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip formatter={(value) => `₱${Number(value).toFixed(2)}`} />
        <Legend />
        <Line
          type="monotone"
          dataKey="total_cost"
          stroke="#4CAF50"
          strokeWidth={3}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  // Render top selling bar chart (Sales)
  const renderTopSellingChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={topSelling}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="item_name" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Bar dataKey="quantity_sold" fill="#4CAF50" radius={[5, 5, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );

  // Render transaction bar chart for successful & failed deliveries
  const renderTransactionStatusChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={transactionStatusData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Legend />
        {/* Single bar plotting counts for each row (Delivered / Cancelled) */}
        <Bar dataKey="count">
          {/* style individual cells */}
          {transactionStatusData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={index === 0 ? "#4CAF50" : "#E57373"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  // Render service delivery failed reasons bar chart
  const renderServiceFailedReasonsChart = () => {
    const data = Object.entries(failedReasonsCount).map(([name, count]) => ({
      name,
      count,
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#E57373" radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // Render customer satisfaction pie chart for rating percentages
  const renderCustomerRatingPieChart = () => {
    // Calculate total ratings count for percentages
    const totalRatings =
      ratingDistribution.reduce((acc, cur) => acc + cur.value, 0) || 0;
    const dataWithPercent =
      totalRatings === 0
        ? [{ name: "No Ratings", value: 1, percent: "0.0" }]
        : ratingDistribution.map((entry) => ({
            ...entry,
            percent: ((entry.value / totalRatings) * 100).toFixed(1),
          }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={dataWithPercent}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, percent }) => `${name}: ${percent}%`}
            labelLine={false}
          >
            {dataWithPercent.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value} ratings`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // PAGINATION FOR EVERY TABLE
  const getItemsPerPage = () => {
    return activeTab === "overall" ? 5 : 15;
  };

  const paginate = (data, currentPage) => {
    const itemsPerPage = getItemsPerPage();
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };

  const renderSalesTable = () => {
    const itemsPerPage = getItemsPerPage();
    const startIndex = (salesPage - 1) * itemsPerPage;
    const paginatedData = filteredSalesData.slice(
      startIndex,
      startIndex + itemsPerPage
    );
    const totalPages = Math.ceil(filteredSalesData.length / itemsPerPage);

    return (
      <>
        <Table
          bordered
          hover
          responsive
          className="shadow-sm"
          style={{ cursor: "default" }}
        >
          <thead className="table-success">
            <tr>
              <th>Date</th>
              <th>Customer Name</th>
              <th>Item Name</th>
              <th>Quantity</th>
              <th>Unit Cost</th>
              <th>Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center">
                  No sales data found.
                </td>
              </tr>
            ) : (
              paginatedData.map((row, i) => (
                <tr key={i} className="table-row-hover">
                  <td>{formatDate(row.date)}</td>
                  <td>{row.customer_name}</td>
                  <td>{row.item_name}</td>
                  <td>{row.qty}</td>
                  <td>
                    ₱
                    {Number(row.unit_cost).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td>
                    ₱
                    {Number(row.total_cost).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>

        {/* Pagination */}
        <div className="custom-pagination">
          <button
            className="page-btn"
            disabled={salesPage === 1}
            onClick={() => setSalesPage(salesPage - 1)}
          >
            ‹
          </button>
          <span className="page-info">
            Page {salesPage} of {totalPages}
          </span>
          <button
            className="page-btn"
            disabled={salesPage === totalPages}
            onClick={() => setSalesPage(salesPage + 1)}
          >
            ›
          </button>
        </div>
      </>
    );
  };

  const renderTransactionTable = () => {
    const itemsPerPage = getItemsPerPage();
    const startIndex = (transactionPage - 1) * itemsPerPage;
    const paginatedData = filteredTransactionData.slice(
      startIndex,
      startIndex + itemsPerPage
    );
    const totalPages = Math.ceil(filteredTransactionData.length / itemsPerPage);

    return (
      <>
        <Table
          bordered
          hover
          responsive
          className="shadow-sm"
          style={{ cursor: "default" }}
        >
          <thead className="table-info">
            <tr>
              <th>Transaction No.</th>
              <th>Customer Name</th>
              <th>Address</th>
              <th>Contact Number</th>
              <th>Date of Order</th>
              <th>Item Name</th>
              <th>Quantity</th>
              <th>Total Cost</th>
              <th>Mode of Payment</th>
              <th>Delivery Status</th>
              <th>Delivery Personnel</th> {/* New column */}
              <th>Ship Out At</th>
              <th>Completed At</th>
              <th>Reason for Cancellation</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={14} className="text-center">
                  No transaction data found.
                </td>
              </tr>
            ) : (
              paginatedData.map((row, i) => (
                <tr key={i} className="table-row-hover">
                  <td>{row.transaction_id}</td>
                  <td>{row.customer_name}</td>
                  <td>{row.customer_address}</td>
                  <td>{row.customer_contact}</td>
                  <td>{formatDate(row.date_of_order)}</td>
                  <td>{row.item_name}</td>
                  <td>{row.qty}</td>
                  <td>
                    ₱
                    {Number(row.total_cost).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td>{row.mode_of_payment}</td>
                  <td>{row.delivery_status}</td>
                  <td>{row.delivery_personnel || "-"}</td>
                  <td>{row.shipout_at ? formatDate(row.shipout_at) : "-"}</td>
                  <td>
                    {row.completed_at ? formatDate(row.completed_at) : "-"}
                  </td>
                  <td>{row.cancelled_reason || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>

        {/* Pagination */}
        <div className="custom-pagination">
          <button
            className="page-btn"
            disabled={transactionPage === 1}
            onClick={() => setTransactionPage(transactionPage - 1)}
          >
            ‹
          </button>
          <span className="page-info">
            Page {transactionPage} of {totalPages}
          </span>
          <button
            className="page-btn"
            disabled={transactionPage === totalPages}
            onClick={() => setTransactionPage(transactionPage + 1)}
          >
            ›
          </button>
        </div>
      </>
    );
  };

  const renderServiceTable = () => {
    const itemsPerPage = getItemsPerPage();
    const startIndex = (servicePage - 1) * itemsPerPage;
    const paginatedData = filteredServiceData.slice(
      startIndex,
      startIndex + itemsPerPage
    );
    const totalPages = Math.ceil(filteredServiceData.length / itemsPerPage);

    return (
      <>
        <Table
          bordered
          hover
          responsive
          className="shadow-sm"
          style={{ cursor: "default" }}
        >
          <thead className="table-warning">
            <tr>
              <th>Date</th>
              <th>Customer Name</th>
              <th>Item Name</th>
              <th>Delivery Status</th>
              <th>Reason for Cancellation</th> {/* New column */}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center">
                  No service delivery data found.
                </td>
              </tr>
            ) : (
              paginatedData.map((row, i) => (
                <tr key={i} className="table-row-hover">
                  <td>{formatDate(row.date)}</td>
                  <td>{row.customer_name}</td>
                  <td>{row.item_name}</td>
                  <td>{row.delivery_status}</td>
                  <td>{row.cancelled_reason || "-"}</td> {/* New cell */}
                </tr>
              ))
            )}
          </tbody>
        </Table>

        {/* Pagination */}
        <div className="custom-pagination">
          <button
            className="page-btn"
            disabled={servicePage === 1}
            onClick={() => setServicePage(servicePage - 1)}
          >
            ‹
          </button>
          <span className="page-info">
            Page {servicePage} of {totalPages}
          </span>
          <button
            className="page-btn"
            disabled={servicePage === totalPages}
            onClick={() => setServicePage(servicePage + 1)}
          >
            ›
          </button>
        </div>
      </>
    );
  };

  const renderCustomerTable = () => {
    const itemsPerPage = getItemsPerPage();
    const startIndex = (customerPage - 1) * itemsPerPage;
    const paginatedData = filteredCustomerData.slice(
      startIndex,
      startIndex + itemsPerPage
    );
    const totalPages = Math.ceil(filteredCustomerData.length / itemsPerPage);

    return (
      <>
        <Table
          bordered
          hover
          responsive
          className="shadow-sm"
          style={{ cursor: "default" }}
        >
          <thead className="table-secondary">
            <tr>
              <th>Date</th>
              <th>Customer Name</th>
              <th>Item Name</th>
              <th>Customer Rating</th>
              <th>Delivery Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center">
                  No customer satisfaction data found.
                </td>
              </tr>
            ) : (
              paginatedData.map((row, i) => (
                <tr key={i} className="table-row-hover">
                  <td>{formatDate(row.date)}</td>
                  <td>{row.customer_name}</td>
                  <td>{row.item_name}</td>
                  <td>{row.customer_rating ?? "N/A"}</td>
                  <td>{row.delivery_status}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>

        {/* Pagination */}
        <div className="custom-pagination">
          <button
            className="page-btn"
            disabled={customerPage === 1}
            onClick={() => setCustomerPage(customerPage - 1)}
          >
            ‹
          </button>
          <span className="page-info">
            Page {customerPage} of {totalPages}
          </span>
          <button
            className="page-btn"
            disabled={customerPage === totalPages}
            onClick={() => setCustomerPage(customerPage + 1)}
          >
            ›
          </button>
        </div>
      </>
    );
  };

  // generatePDF left unchanged (keeps your implementation)
  const generatePDF = async () => {
    if (!reportRef.current) return;
    const clone = reportRef.current.cloneNode(true);
    clone.style.position = "fixed";
    clone.style.top = "-9999px";
    clone.style.left = "-9999px";
    clone.style.width = `${reportRef.current.offsetWidth}px`;
    document.body.appendChild(clone);
    await new Promise((res) => setTimeout(res, 100));
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginX = 12;
    const footerGap = 40;
    const usableHeight = pageHeight - footerGap;
    let cursorY = 10;
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("Delivery Tracking System", pageWidth / 2, cursorY, {
      align: "center",
    });
    cursorY += 10;
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      `Report Type: ${
        REPORT_TYPES.find((r) => r.value === reportType)?.label || "All Reports"
      }`,
      marginX,
      cursorY
    );
    cursorY += 7;
    pdf.text(`Period: ${startDate} to ${endDate}`, marginX, cursorY);
    cursorY += 10;
    const sections = Array.from(clone.children);
    for (const section of sections) {
      const canvas = await html2canvas(section, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#fff",
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight,
        scrollX: 0,
        scrollY: 0,
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pageWidth) / imgProps.width;
      if (cursorY + imgHeight > usableHeight) {
        pdf.addPage();
        cursorY = 20;
      }
      pdf.addImage(
        imgData,
        "JPEG",
        marginX,
        cursorY,
        pageWidth - 2 * marginX,
        imgHeight
      );
      cursorY += imgHeight + 10;
    }
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "italic");
      pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, {
        align: "center",
      });
    }
    pdf.save(`report_${reportType}_${startDate}_to_${endDate}.pdf`);
    document.body.removeChild(clone);
  };

  return (
    <AdminLayout title="Generate Report">
      <style>{`
        .table-row-hover:hover { background-color: #f1f3f5 !important; transition: background-color 0.3s ease; }
        .btn-primary, .btn-success, .btn-danger { transition: box-shadow 0.3s ease; }
        .btn-primary:hover, .btn-success:hover, .btn-danger:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .card { border-radius: 0.75rem; cursor: default; }
      `}</style>
      {/* Buttons */}
      <br /> <br />
      <br />
      <div className="d-flex justify-content-between align-items-center mb-3 no-print mx-4">
        <Button
          variant="success"
          onClick={() => navigate("/add-delivery")}
          className="d-flex align-items-center gap-2"
        >
          <FaPlus /> Add New Delivery
        </Button>
        <div>
          <Button
            variant="primary"
            className="me-2"
            onClick={() => setShowFilter(true)}
          >
            <FaFilter /> Filter Reports
          </Button>
          <Button variant="danger" onClick={generatePDF}>
            <FaFilePdf /> Generate PDF
          </Button>
        </div>
      </div>
      {/* Totals cards */}
      <div className="mx-4">
        {(reportType === "sales" ||
          reportType === "transaction" ||
          reportType === "all") &&
          renderTotalsCard()}
        {(reportType === "service" || reportType === "all") &&
          renderServiceTotalsCard()}
      </div>
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="success" />
        </div>
      ) : (
        <>
          {(reportType === "sales" || reportType === "all") && (
            <div
              ref={salesRef}
              className="report-container mb-5"
              style={{
                backgroundColor: "white",
                padding: "15px",
                borderRadius: "8px",
              }}
            >
              {" "}
              <>
                <h2 className="text-success mt-3 mb-3 text-center">
                  Sales Report
                </h2>
                <h5 className="mb-2 text-center">Sales Growth Over Time</h5>
                {renderSalesGrowthChart()}
                <h5 className="mt-4 mb-2 text-center">Top Selling Items</h5>
                {renderTopSellingChart()} <br /> <br />
                {renderSalesTable()}
              </>
            </div>
          )}

          {(reportType === "transaction" || reportType === "all") && (
            <div
              ref={transactionRef}
              className="report-container mb-5"
              style={{
                backgroundColor: "white",
                padding: "15px",
                borderRadius: "8px",
              }}
            >
              {" "}
              <>
                <h2 className="text-info mt-3 mb-3 text-center">
                  Transaction Report
                </h2>
                <h5 className="mb-2 text-center">
                  Delivery Status (Delivered vs Cancelled)
                </h5>
                {renderTransactionStatusChart()} <br /> <br />
                {renderTransactionTable()}
              </>
            </div>
          )}

          {(reportType === "service" || reportType === "all") && (
            <div
              ref={serviceRef}
              className="report-container mb-5"
              style={{
                backgroundColor: "white",
                padding: "15px",
                borderRadius: "8px",
              }}
            >
              {" "}
              <>
                <h2 className="text-warning mt-3 mb-3 text-center">
                  Service Delivery Report
                </h2>
                <h5 className="mb-2 text-center">Failed Delivery Reasons</h5>
                {renderServiceFailedReasonsChart()} <br /> <br />
                {renderServiceTable()}
              </>
            </div>
          )}

          {(reportType === "customer" || reportType === "all") && (
            <div
              ref={customerRef}
              className="report-container mb-5"
              style={{
                backgroundColor: "white",
                padding: "15px",
                borderRadius: "8px",
              }}
            >
              {" "}
              <>
                <h2 className="text-secondary mt-3 mb-3 text-center">
                  Customer Satisfaction Report
                </h2>
                <h5 className="mb-2 text-center">
                  Customer Rating Distribution
                </h5>
                {renderCustomerRatingPieChart()} <br />
                <br />
                {renderCustomerTable()}
              </>
            </div>
          )}
        </>
      )}
      {/* Filter Modal */}
      <Modal show={showFilter} onHide={() => setShowFilter(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Filter Reports</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="filterStartDate">
              <Form.Label className="text-success">Start Date</Form.Label>
              <Form.Control
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="filterEndDate">
              <Form.Label className="text-success">End Date</Form.Label>
              <Form.Control
                type="date"
                value={endDate}
                min={startDate || undefined}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="filterPeriod">
              <Form.Label className="text-success">Period</Form.Label>
              <Form.Select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                {PERIODS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group controlId="filterReportType" className="mb-3">
              <Form.Label className="text-success">Report Type</Form.Label>
              <Form.Select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                {REPORT_TYPES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            {["all", "transaction"].includes(reportType) && (
              <Form.Group controlId="filterDeliveryStatus" className="mb-3">
                <Form.Label className="text-success">
                  Delivery Status
                </Form.Label>
                <Form.Select
                  value={deliveryStatus}
                  onChange={(e) => setDeliveryStatus(e.target.value)}
                >
                  <option value="">Select Delivery Status</option>
                  <option value="pending">Pending</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Form.Group>
            )}

            {["all", "transaction"].includes(reportType) && (
              <Form.Group controlId="filterDeliveryPersonnel" className="mb-3">
                <Form.Label className="text-success">
                  Delivery Personnel
                </Form.Label>
                <Form.Select
                  value={deliveryPersonnel}
                  onChange={(e) => setDeliveryPersonnel(e.target.value)}
                >
                  <option value="">Select Delivery Personnel</option>
                  {deliveryPersonnelOptions.map((person, idx) => (
                    <option key={idx} value={person}>
                      {person}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            {["all", "transaction", "service"].includes(reportType) && (
              <Form.Group controlId="filterCancellationReason" className="mb-3">
                <Form.Label className="text-success">
                  Reason for Cancellation
                </Form.Label>
                <Form.Select
                  value={cancellationReasonFilter}
                  onChange={(e) => setCancellationReasonFilter(e.target.value)}
                >
                  <option value="">Select Reason for Cancellation</option>
                  {cancellationReasonOptions.map((reason, idx) => (
                    <option key={idx} value={reason}>
                      {reason}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFilter(false)}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowFilter(false);
              setActiveTab("filtered");
              fetchData();
            }}
          >
            Apply Filters
          </Button>
        </Modal.Footer>
      </Modal>
    </AdminLayout>
  );
};

export default GenerateReport;
