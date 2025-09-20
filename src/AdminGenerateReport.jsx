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
  { value: "service", label: "Delivery Service Report" },
  { value: "customer", label: "Client Satisfaction Report" },
  { value: "all", label: "Overall Reports" },
];

const PERIODS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annual" },
];

const COLORS = ["#4CAF50", "#E57373", "#FFC107", "#2196F3", "#9C27B0"];

const GenerateReport = () => {
  const navigate = useNavigate();
  const reportRef = useRef(null);

  // Filter modal state
  const [showFilter, setShowFilter] = useState(false);
  const [period, setPeriod] = useState(() => {
    return localStorage.getItem("reportPeriod") || "monthly";
  });

  const [reportType, setReportType] = useState(() => {
    return localStorage.getItem("reportType") || "all";
  });

  const [startDate, setStartDate] = useState(() => {
    return localStorage.getItem("reportStartDate") || "";
  });

  const [endDate, setEndDate] = useState(() => {
    return localStorage.getItem("reportEndDate") || "";
  });

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("reportActiveTab") || "overall";
  });

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
  const [paymentOptionFilter, setPaymentOptionFilter] = useState("");

  const salesRef = useRef(null);
  const transactionRef = useRef(null);
  const serviceRef = useRef(null);
  const customerRef = useRef(null);

  const [salesPage, setSalesPage] = useState(1);
  const [transactionPage, setTransactionPage] = useState(1);
  const [servicePage, setServicePage] = useState(1);
  const [customerPage, setCustomerPage] = useState(1);

  const [failedReasons, setFailedReasons] = useState({});

  // Fetch data based on filters
  useEffect(() => {
    fetchData();
  }, [
    startDate,
    endDate,
    period,
    reportType,
    paymentOptionFilter,
    deliveryStatus,
    deliveryPersonnel,
    cancellationReasonFilter,
  ]);

  useEffect(() => {}, [
    salesData,
    topSelling,
    transactionData,
    serviceData,
    customerData,
  ]);

  useEffect(() => {
    localStorage.setItem("reportPeriod", period);
  }, [period]);

  useEffect(() => {
    localStorage.setItem("reportType", reportType);
  }, [reportType]);

  useEffect(() => {
    localStorage.setItem("reportStartDate", startDate);
  }, [startDate]);

  useEffect(() => {
    localStorage.setItem("reportEndDate", endDate);
  }, [endDate]);

  useEffect(() => {
    localStorage.setItem("reportActiveTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    const handleRescheduleEvent = () => {
      fetchServiceData();
    };

    window.addEventListener("deliveryRescheduled", handleRescheduleEvent);

    return () => {
      window.removeEventListener("deliveryRescheduled", handleRescheduleEvent);
    };
  }, []);

  // Normalizers (defensive)
  const normalizeSales = (raw = []) =>
    (Array.isArray(raw) ? raw : [])
      .map((r) => ({
        transaction_id: r.transaction_id ?? r.id ?? null,
        date_of_order: r.date_of_order ? formatDate(r.date_of_order) : "-",
        customer_name: r.customer_name ?? r.customer ?? "Unknown",
        item_name: r.item_name ?? r.description ?? "-",
        qty: Number(r.qty ?? r.quantity ?? 0),
        unit_cost: Number(r.unit_cost ?? r.unit_price ?? 0),
        total_cost: Number(r.total_cost ?? r.total ?? 0),
        delivery_status: (
          r.delivery_status ??
          r.status ??
          "delivered"
        ).toLowerCase(),
        payment_option: r.payment_option ?? r.mode_of_payment ?? "Full Payment",
        down_payment: Number(r.down_payment ?? 0),
        balance: Number(r.balance ?? 0),
      }))
      .filter((sale) => sale.delivery_status === "delivered");

  const normalizeTopSelling = (raw = []) =>
    (Array.isArray(raw) ? raw : []).map((r) => ({
      item_name: r.item_name ?? r.name ?? "Unknown",
      quantity_sold: Number(r.quantity_sold ?? r.qty ?? r.count ?? 0),
    }));

  const normalizeTransactions = (raw = []) =>
    (Array.isArray(raw) ? raw : []).map((r) => ({
      transaction_id: r.transaction_id ?? r.id ?? null,
      tracking_number: r.tracking_number ?? "-",
      customer_name: r.customer_name ?? r.customer ?? "Unknown",
      customer_address: r.customer_address ?? r.address ?? "-",
      customer_contact: r.customer_contact ?? r.contact ?? "-",
      date_of_order: r.date_of_order
        ? new Date(r.date_of_order).toISOString().slice(0, 10)
        : null,
      item_name: r.item_name ?? r.description ?? "-",
      qty: Number(r.qty ?? r.quantity ?? 0),

      unit_cost: Number(r.unit_cost ?? 0),
      subtotal: Number(r.subtotal ?? (r.qty ?? 0) * (r.unit_cost ?? 0)),

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
      delivery_personnel: r.delivery_personnel ?? r.delivery_person ?? "-",
      payment_option: r.payment_option ?? "Full Payment",
      down_payment: Number(r.down_payment ?? 0),
      balance: Number(r.balance ?? 0),
    }));

  const normalizeService = (raw = []) =>
    (Array.isArray(raw) ? raw : []).map((r) => {
      let normalizedReason =
        r.cancelled_reason ?? r.cancellation_reason ?? null;
      if (normalizedReason) {
        const lower = String(normalizedReason).toLowerCase();
        if (lower.includes("vehicle")) {
          normalizedReason = "Vehicle-related Issue";
        } else if (lower.includes("location")) {
          normalizedReason = "Location Inaccessible";
        }
      }

      return {
        transaction_id: r.transaction_id ?? null,
        date_of_order: r.date_of_order
          ? new Date(r.date_of_order).toISOString().slice(0, 10)
          : null,
        customer_name: r.customer_name ?? r.customer ?? "Unknown",
        item_name: r.item_name ?? r.description ?? "-",
        qty: Number(r.qty ?? r.quantity ?? 0),
        delivery_status: r.delivery_status ?? r.status ?? "Pending",
        cancelled_reason: normalizedReason ?? "-",
        rescheduled_date: r.rescheduled_date ?? null,
        target_date_delivery: r.target_date_delivery ?? null,
      };
    });

  const normalizeCustomer = (raw = []) =>
    (Array.isArray(raw) ? raw : []).map((r) => ({
      transaction_id: r.transaction_id ?? null,
      date_of_order: r.date_of_order ? formatDate(r.date_of_order) : "-",
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
        let normalizedSales = normalizeSales(data.sales ?? []);
        // Filter to only delivered sales
        normalizedSales = normalizedSales.filter(
          (sale) => sale.delivery_status.toLowerCase() === "delivered"
        );
        setSalesData(normalizedSales);
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

        // ⬇️ new: store failedReasons from PHP response
        if (data.failedReasons) {
          setFailedReasons(data.failedReasons);
        }

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

      console.log("Normalized Transactions:", normalizedTransactions);
      console.log("Delivered Transaction IDs:", deliveredTransactionIds);
      console.log("Normalized Sales:", normalizedSales);
    } finally {
      setLoading(false);
    }
  };

  // Helper: format date for display
  const formatDate = (d) => {
    if (!d) return "";
    const dateObj = new Date(d);
    if (isNaN(dateObj)) return "";

    const month = String(dateObj.getMonth() + 1).padStart(2, "0"); // month first
    const day = String(dateObj.getDate()).padStart(2, "0");
    const year = dateObj.getFullYear();

    return `${month}/${day}/${year}`;
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

  // Utility: group transactions into single rows
  const groupTransactions = (data) => {
    return Object.values(
      data.reduce((acc, row) => {
        const id = row.transaction_id;
        if (!acc[id]) {
          acc[id] = {
            ...row,
            item_name: [],
            qty: [],
            unit_cost: [],
            total_cost: [],
          };
        }
        acc[id].item_name.push(row.item_name);
        acc[id].qty.push(row.qty);
        if (row.unit_cost) acc[id].unit_cost.push(row.unit_cost);
        if (row.total_cost) acc[id].total_cost.push(row.total_cost);
        return acc;
      }, {})
    ).map((row) => ({
      ...row,
      item_name: row.item_name.join(", "),
      qty: row.qty.join(", "),
      unit_cost: row.unit_cost.join(", "),
      total_cost: row.total_cost.join(", "),
    }));
  };

  const filteredSalesData =
    isValidDate(new Date(startDate)) && isValidDate(new Date(endDate))
      ? salesData.filter((row) => {
          const rowDate = new Date(row.date_of_order);
          if (
            rowDate < new Date(startDate) ||
            rowDate > new Date(endDate) ||
            row.delivery_status.toLowerCase() !== "delivered"
          )
            return false;

          if (
            paymentOptionFilter &&
            row.payment_option.toLowerCase() !==
              paymentOptionFilter.toLowerCase()
          )
            return false;

          return true;
        })
      : salesData.filter(
          (row) =>
            row.delivery_status.toLowerCase() === "delivered" &&
            (!paymentOptionFilter ||
              row.payment_option.toLowerCase() ===
                paymentOptionFilter.toLowerCase())
        );

  const filteredTransactionData =
    isValidDate(new Date(startDate)) && isValidDate(new Date(endDate))
      ? transactionData.filter((row) => {
          const rowDate = new Date(row.date_of_order || row.date_of_order);
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

          if (
            paymentOptionFilter &&
            row.payment_option.toLowerCase() !==
              paymentOptionFilter.toLowerCase()
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

          if (
            paymentOptionFilter &&
            row.payment_option.toLowerCase() !==
              paymentOptionFilter.toLowerCase()
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
          const rowDate = new Date(row.date_of_order); // <- use date_of_order
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
          const rowDate = new Date(row.date_of_order);
          if (rowDate < new Date(startDate) || rowDate > new Date(endDate))
            return false;

          // Only include delivered transactions
          if (String(row.delivery_status).toLowerCase() !== "delivered")
            return false;

          return true;
        })
      : customerData.filter((row) => {
          // Only include delivered transactions
          if (String(row.delivery_status).toLowerCase() !== "delivered")
            return false;
          return true;
        });

  const overallClients = new Set(
    transactionData.map((row) => row.customer_name)
  ).size;

  // Totals for Sales report
  const totalSalesAmount = filteredSalesData.reduce(
    (acc, cur) => acc + (Number(cur.total_cost) || 0),
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

  const totalSalesTransaction = filteredTransactionData
    .filter((row) => String(row.delivery_status).toLowerCase() === "delivered")
    .reduce((acc, cur) => acc + (Number(cur.total_cost) || 0), 0);

  const successfulDeliveries = filteredServiceData.filter(
    (row) => String(row.delivery_status).toLowerCase() === "delivered"
  ).length;

  const failedDeliveries = filteredServiceData.filter(
    (row) => String(row.delivery_status).toLowerCase() === "cancelled"
  ).length;

  // Totals for Items
  const totalItemsOrdered = filteredTransactionData.reduce(
    (sum, row) => sum + (Number(row.qty) || 0),
    0
  );
  const totalItemsDelivered = filteredServiceData
    .filter((row) => String(row.delivery_status).toLowerCase() === "delivered")
    .reduce((sum, row) => sum + (Number(row.qty) || 0), 0);

  const totalTransactionsService = filteredServiceData.length;

  const failedReasonsCount = {
    "Vehicle-related Issue": 0,
    "Location Inaccessible": 0,
  };

  filteredServiceData.forEach((row) => {
    const status = String(row.delivery_status).toLowerCase();
    if (status.includes("cancel") && row.cancelled_reason) {
      const reason = String(row.cancelled_reason).toLowerCase();

      if (reason.includes("vehicle")) {
        failedReasonsCount["Vehicle-related Issue"]++;
      } else if (reason.includes("location")) {
        failedReasonsCount["Location Inaccessible"]++;
      }
    }
  });

  // Customer satisfaction rating distribution chart
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

  const cardsData = {
    totalSales: {
      icon: <FaDollarSign />,
      color: "#4CAF50",
      title: "Total Sales",
      value: `₱${totalSalesAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    },
    totalTransactions: {
      icon: <FaClipboardList />,
      color: "#9C27B0",
      title: "Total Transactions",
      value: totalTransactions,
    },
    successfulDeliveries: {
      icon: <FaCheckCircle />,
      color: "#4CAF50",
      title: "Successful Deliveries",
      value: successfulDeliveries,
    },
    cancelledDeliveries: {
      icon: <FaTimesCircle />,
      color: "#F44336",
      title: "Cancelled/Rescheduled Deliveries",
      value: failedDeliveries,
    },
  };

  const cardsByReportType = {
    sales: ["totalSales", "totalClients", "totalItemsDelivered"],
    transaction: [
      "totalClients",
      "totalItemsSold",
      "totalTransactions",
      "successfulDeliveries",
      "cancelledDeliveries",
    ],
    service: [
      "totalTransactions",
      "successfulDeliveries",
      "cancelledDeliveries",
    ],
    all: [
      ["totalSales", "totalClients", "totalItemsSold", "totalItemsDelivered"],
      ["totalTransactions", "successfulDeliveries", "cancelledDeliveries"],
    ],
    customer: [],
  };

  const renderTotalsCard = () => {
    if (reportType === "customer") return null;

    const cardGroups = cardsByReportType[reportType] || [];
    if (cardGroups.length === 0) return null;

    const getCardData = (key) => {
      if (key === "totalClients") {
        return {
          icon: <FaUsers />,
          color: "#2196F3",
          title: "Total Clients",
          value: reportType === "sales" ? totalCustomersSales : overallClients,
        };
      }
      if (key === "totalItemsSold") {
        return {
          icon: <FaBoxes />,
          color: "#FF9800",
          title: "Total Items Ordered",
          value: totalItemsOrdered,
        };
      }
      if (key === "totalItemsDelivered") {
        return {
          icon: <FaBoxes />,
          color: "#009688",
          title: "Total Items Delivered",
          value: totalItemsDelivered,
        };
      }
      if (key === "successfulDeliveries") {
        return {
          icon: <FaCheckCircle />,
          color: "#4CAF50",
          title: "Successful Deliveries",
          value: successfulDeliveries,
        };
      }
      if (key === "cancelledDeliveries") {
        return {
          icon: <FaTimesCircle />,
          color: "#F44336",
          title: "Cancelled/Rescheduled Deliveries",
          value: failedDeliveries,
        };
      }
      return cardsData[key];
    };
    const renderRow = (keys) => {
      return (
        <Row className="mb-3 g-3">
          {keys.map((key) => {
            const card = getCardData(key);
            if (!card) return null;
            return (
              <Col key={key} className="d-flex">
                <Card
                  className="card-total p-3 flex-fill h-100"
                  style={{ backgroundColor: "white" }}
                >
                  <div className="d-flex align-items-center">
                    <div style={{ ...iconStyle, backgroundColor: card.color }}>
                      {card.icon}
                    </div>
                    <div>
                      <h6 className="fw-semibold">{card.title}</h6>
                      <p className="mb-0 fw-semibold">{card.value}</p>
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      );
    };

    // Render rows for current report
    return Array.isArray(cardGroups[0])
      ? cardGroups.map((row, idx) => <div key={idx}>{renderRow(row)}</div>)
      : renderRow(cardGroups);
  };

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
        <Bar dataKey="count">
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
    // Ensure chart always renders
    const data =
      failedReasons && Object.keys(failedReasons).length > 0
        ? Object.entries(failedReasons).map(([reason, count]) => ({
            reason,
            count,
          }))
        : [{ reason: "No Data", count: 0 }]; // Dummy fallback

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="reason" />
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
  useEffect(() => {
    setActiveTab("overall");
  }, [reportType]);

  const getItemsPerPage = () => {
    return reportType === "all" ? 5 : 15;
  };

  const paginate = (data, currentPage) => {
    const itemsPerPage = getItemsPerPage();
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };

  const renderSalesTable = () => {
    const itemsPerPage = getItemsPerPage();

    // Group by transaction_id
    const groupedData = Object.values(
      filteredSalesData.reduce((acc, row) => {
        const id = row.transaction_id;
        if (!acc[id]) {
          acc[id] = { ...row, items: [] };
        }
        acc[id].items.push({
          name: row.item_name,
          qty: row.qty,
          unit_cost: Number(row.unit_cost),
        });
        return acc;
      }, {})
    );

    const totalPages = Math.ceil(groupedData.length / itemsPerPage);
    const currentPage = Math.max(1, Math.min(salesPage, totalPages || 1));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = groupedData.slice(
      startIndex,
      startIndex + itemsPerPage
    );

    return (
      <>
        <Table
          bordered
          hover
          responsive
          className="shadow-sm text-center"
          style={{ cursor: "default" }}
        >
          <thead className="table-success">
            <tr>
              <th>Transaction No.</th>
              <th>Date of Order</th>
              <th>Client</th>
              <th>Item Name</th>
              <th>Quantity</th>
              <th>Unit Cost</th>
              <th>Subtotal</th>
              <th>Total Cost</th>
              <th>Payment Option</th>
              <th>Down Payment</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center">
                  No sales data found.
                </td>
              </tr>
            ) : (
              paginatedData.map((row, i) => {
                // compute subtotals per item
                const subtotals = row.items.map(
                  (item) => item.qty * item.unit_cost
                );

                // compute total cost
                const totalCost = subtotals.reduce((a, b) => a + b, 0);

                return (
                  <tr key={i} className="table-row-hover">
                    <td>{row.transaction_id || "-"}</td>
                    <td>{formatDate(row.date_of_order)}</td>
                    <td>{row.customer_name}</td>
                    <td>
                      {row.items.map((item, j) => (
                        <div key={j}>{item.name}</div>
                      ))}
                    </td>
                    <td>
                      {row.items.map((item, j) => (
                        <div key={j}>{item.qty}</div>
                      ))}
                    </td>
                    <td>
                      {row.items.map((item, j) => (
                        <div key={j}>
                          ₱
                          {item.unit_cost.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      ))}
                    </td>
                    <td>
                      {subtotals.map((st, j) => (
                        <div key={j}>
                          ₱
                          {st.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      ))}
                    </td>
                    <td>
                      ₱
                      {totalCost.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>{row.payment_option}</td>
                    <td>
                      ₱
                      {Number(row.down_payment).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      ₱
                      {Number(row.balance).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>

        {/* SALES PAGINATION */}
        <div className="custom-pagination">
          <button
            className="page-btn"
            disabled={currentPage === 1}
            onClick={() => setSalesPage(currentPage - 1)}
          >
            ‹
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="page-btn"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setSalesPage(currentPage + 1)}
          >
            ›
          </button>
        </div>
      </>
    );
  };

  const renderTransactionTable = () => {
    const itemsPerPage = getItemsPerPage();

    const groupedData = Object.values(
      filteredTransactionData.reduce((acc, row) => {
        const id = row.transaction_id;
        if (!acc[id]) {
          acc[id] = { ...row, items: [] };
        }
        acc[id].items.push({
          name: row.item_name,
          qty: Number(row.qty),
          unit_cost: Number(row.unit_cost),
        });

        return acc;
      }, {})
    );

    const totalPages = Math.ceil(groupedData.length / itemsPerPage);
    const currentPage = Math.max(1, Math.min(transactionPage, totalPages || 1));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = groupedData.slice(
      startIndex,
      startIndex + itemsPerPage
    );

    return (
      <>
        <Table bordered hover responsive className="shadow-sm text-center">
          <thead className="table-info">
            <tr>
              <th>Transaction No.</th>
              <th>Tracking No.</th>
              <th>Date of Order</th>
              <th>Client</th>
              <th>Address</th>
              <th>Contact Number</th>
              <th>Item Name</th>
              <th>Quantity</th>
              <th>Unit Cost</th>
              <th>Subtotal</th>
              <th>Total Cost</th>
              <th>Mode of Payment</th>
              <th>Payment Option</th>
              <th>Down Payment</th>
              <th>Balance</th>
              <th>Delivery Personnel</th>
              <th>Delivery Status</th>
              <th>Ship Out At</th>
              <th>Completed At</th>
              <th>Reason for Cancellation</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={20} className="text-center">
                  No transaction data found.
                </td>
              </tr>
            ) : (
              paginatedData.map((row, i) => {
                // compute subtotals per item
                const subtotals = row.items.map(
                  (item) => item.qty * item.unit_cost
                );

                // compute total cost
                const totalCost = subtotals.reduce((a, b) => a + b, 0);

                return (
                  <tr key={i}>
                    <td>{row.transaction_id}</td>
                    <td>{row.tracking_number || "-"}</td>
                    <td>{formatDate(row.date_of_order)}</td>
                    <td>{row.customer_name}</td>
                    <td>{row.customer_address}</td>
                    <td>{row.customer_contact}</td>

                    <td>
                      {row.items.map((item, j) => (
                        <div key={j}>{item.name}</div>
                      ))}
                    </td>

                    <td>
                      {row.items.map((item, j) => (
                        <div key={j}>{item.qty}</div>
                      ))}
                    </td>

                    <td>
                      {row.items.map((item, j) => (
                        <div key={j}>
                          ₱
                          {item.unit_cost.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      ))}
                    </td>

                    <td>
                      {subtotals.map((st, j) => (
                        <div key={j}>
                          ₱
                          {st.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      ))}
                    </td>

                    <td>
                      ₱
                      {totalCost.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    <td>{row.mode_of_payment || "-"}</td>

                    <td>{row.payment_option || "-"}</td>

                    <td>
                      ₱
                      {Number(row.down_payment).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    <td>
                      ₱
                      {Number(row.balance).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    <td>{row.delivery_personnel || "-"}</td>

                    <td>{row.delivery_status || "-"}</td>

                    <td>{row.shipout_at ? formatDate(row.shipout_at) : "-"}</td>

                    <td>
                      {row.completed_at ? formatDate(row.completed_at) : "-"}
                    </td>

                    <td>
                      {row.cancelled_reason &&
                      row.cancelled_reason.trim() !== ""
                        ? row.cancelled_reason
                        : "No Cancellation"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>

        {/* Pagination */}
        <div className="custom-pagination">
          <button
            className="page-btn"
            disabled={currentPage === 1}
            onClick={() => setTransactionPage(currentPage - 1)}
          >
            ‹
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="page-btn"
            disabled={currentPage === totalPages}
            onClick={() => setTransactionPage(currentPage + 1)}
          >
            ›
          </button>
        </div>
      </>
    );
  };

  const renderServiceTable = () => {
    const itemsPerPage = getItemsPerPage();

    const groupedData = Object.values(
      filteredServiceData.reduce((acc, row) => {
        const id = row.transaction_id;
        if (!acc[id]) acc[id] = { ...row, items: [] };
        acc[id].items.push({ name: row.item_name });
        return acc;
      }, {})
    );

    const totalPages = Math.ceil(groupedData.length / itemsPerPage);
    const currentPage = Math.max(1, Math.min(servicePage, totalPages || 1));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = groupedData.slice(
      startIndex,
      startIndex + itemsPerPage
    );

    return (
      <>
        <Table bordered hover responsive className="shadow-sm text-center">
          <thead className="table-warning">
            <tr>
              <th>Transaction No.</th>
              <th>Date of Order</th>
              <th>Client</th>
              {/* <th>Item Name</th> */}
              <th>Delivery Status</th>
              <th>Initial Delivery Date</th>
              <th>Rescheduled Date</th>
              <th>Reason for Cancellation</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={8}>No delivery service data found.</td>
              </tr>
            ) : (
              paginatedData.map((row, i) => {
                let displayStatus =
                  row.delivery_status === "Cancelled"
                    ? "Cancelled (For Rescheduling)"
                    : row.delivery_status;
                let targetDate = row.target_date_delivery
                  ? formatDate(row.target_date_delivery)
                  : "-";
                let rescheduledDate = row.rescheduled_date
                  ? formatDate(row.rescheduled_date)
                  : "Not Rescheduled";

                return (
                  <tr key={i}>
                    <td>{row.transaction_id}</td>
                    <td>{formatDate(row.date_of_order)}</td>
                    <td>{row.customer_name}</td>
                    <td>{displayStatus}</td>
                    <td>{targetDate}</td>
                    <td>{rescheduledDate}</td>
                    <td>
                      {row.cancelled_reason && row.cancelled_reason !== "-"
                        ? row.cancelled_reason
                        : "No Cancellation"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </>
    );
  };

  const renderCustomerTable = () => {
    const itemsPerPage = getItemsPerPage();

    // Group by transaction_id to avoid duplicates
    const groupedData = Object.values(
      filteredCustomerData.reduce((acc, row) => {
        if (!acc[row.transaction_id]) {
          acc[row.transaction_id] = row; // keep only the first occurrence
        }
        return acc;
      }, {})
    );

    const startIndex = (customerPage - 1) * itemsPerPage;
    const paginatedData = groupedData.slice(
      startIndex,
      startIndex + itemsPerPage
    );
    const totalPages = Math.ceil(groupedData.length / itemsPerPage);

    return (
      <>
        <Table
          bordered
          hover
          responsive
          className="shadow-sm text-center"
          style={{ cursor: "default" }}
        >
          <thead>
            <tr className="customer-header">
              <th>Transaction No.</th>
              <th>Date of Order</th>
              <th>Client</th>
              <th>Ratings</th>
              <th>Delivery Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center">
                  No client satisfaction data found.
                </td>
              </tr>
            ) : (
              paginatedData.map((row, i) => (
                <tr key={i} className="table-row-hover">
                  <td>{row.transaction_id || "-"}</td>
                  <td>{row.date_of_order}</td>
                  <td>{row.customer_name}</td>
                  <td>{row.customer_rating ?? "N/A"}</td>
                  <td>{row.delivery_status}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>

        {/* CUSTOMER SATISFACTION PAGINATION */}
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

  return (
    <AdminLayout title="Generate Report">
      <style>{`
        .table-row-hover:hover { background-color: #f1f3f5 !important; transition: background-color 0.3s ease; }
        .btn-primary, .btn-success, .btn-danger { transition: box-shadow 0.3s ease; }
        .btn-primary:hover, .btn-success:hover, .btn-danger:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .card { border-radius: 0.75rem; cursor: default; }
      `}</style>
      {/* BUTTONS  */}
      <br /> <br />
      <br />
      <div className="report-btn d-flex justify-content-between align-items-center mb-3 no-print mx-4">
        <div className="filter-generate">
          <Button
            variant="primary"
            className="me-2 btn btn-view px-3 py-2 rounded"
            onClick={() => setShowFilter(true)}
          >
            <FaFilter /> Filter Reports
          </Button>
          <Button variant="danger" className="btn cancel-btn px-3 py-2 rounded">
            <FaFilePdf /> Generate PDF
          </Button>
        </div>
        <Button
          variant="success"
          onClick={() => navigate("/add-delivery")}
          className="d-flex align-items-center gap-2 btn add-delivery px-3 py-2 rounded"
          style={{ fontSize: "15px" }}
        >
          <FaPlus /> Add New Delivery
        </Button>
      </div>
      {/* REPORT CONTENT  */}
      <div className="period-title text-center" ref={reportRef}>
        <h5 className="text-success fs-1 mt-3 mb-4 fw-semibold">
          {`${
            REPORT_TYPES.find((r) => r.value === reportType)?.label || "Report"
          } for the ${
            PERIODS.find((p) => p.value === period)?.label || ""
          } Period`}
        </h5>
      </div>
      {/* TOTAL CARDS  */}
      <div className="mx-4">{renderTotalsCard()}</div>
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
              <>
                <h2 className="text-success mt-3 mb-3 text-center fw-semibold">
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
              <>
                <h2
                  className="mt-3 mb-3 text-center fw-semibold"
                  style={{ color: "#3C75C0" }}
                >
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
              <>
                <h2
                  className="mt-3 mb-3 text-center fw-semibold"
                  style={{ color: "#DC9A34" }}
                >
                  Delivery Service Report
                </h2>
                <h5 className="mb-2 text-center">Cancellation Reasons</h5>
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
              <>
                <h2
                  className="mt-3 mb-3 text-center fw-semibold"
                  style={{ color: "#CB5C5C" }}
                >
                  Client Satisfaction Report
                </h2>
                <h5 className="mb-2 text-center">Client Rating Distribution</h5>
                {renderCustomerRatingPieChart()} <br />
                <br />
                {renderCustomerTable()}
              </>
            </div>
          )}
        </>
      )}
      {/* FILTERING MODAL */}
      <Modal show={showFilter} onHide={() => setShowFilter(false)} centered>
        <Modal.Header closeButton className="bg-white text-success">
          <Modal.Title className="fw-bold">Filter Reports</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light">
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

            {["all", "transaction", "sales"].includes(reportType) && (
              <Form.Group controlId="filterPaymentOption" className="mb-3">
                <Form.Label className="text-success">Payment Option</Form.Label>
                <Form.Select
                  value={paymentOptionFilter}
                  onChange={(e) => setPaymentOptionFilter(e.target.value)}
                >
                  <option value="">Select Payment Option</option>
                  <option value="Full Payment">Full Payment</option>
                  <option value="Down Payment">Down Payment</option>
                </Form.Select>
              </Form.Group>
            )}

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
        <Modal.Footer className="bg-white">
          <Button
            className="btn close-btn px-3 py-2 fs-6 rounded-2"
            onClick={() => setShowFilter(false)}
          >
            Close
          </Button>
          <Button
            className="btn btn-view px-3 py-2 rounded-2 fs-6"
            onClick={() => {
              setShowFilter(false);
              setActiveTab("overall");
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
