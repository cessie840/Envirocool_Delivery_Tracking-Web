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
import "jspdf-autotable";
import html2canvas from "html2canvas";

import logo from "./assets/envirocool-logo.png";

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
      fetchServiceData(); // your function to fetch delivery service data
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

      // 👇 these were missing
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
        delivery_status: r.delivery_status ?? r.status ?? "Pending",
        target_date_delivery: r.target_date_delivery ?? null,
        rescheduled_date: r.rescheduled_date ?? null,
        cancelled_reason: normalizedReason ?? "-",
      };
    });

const normalizeCustomer = (raw = []) =>
  (Array.isArray(raw) ? raw : []).map((r) => ({
    transaction_id: r.transaction_id ?? null,
    date_of_order: r.date_of_order
      ? new Date(r.date_of_order).toISOString().split("T")[0]
      : "-", // formatted once here
    customer_name: r.customer_name ?? r.customer ?? "Unknown",
    item_name: r.item_name ?? r.description ?? "-",
    customer_rating: r.customer_rating != null ? Number(r.customer_rating) : null,
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
  const totalSalesTransaction = filteredTransactionData
    .filter((row) => String(row.delivery_status).toLowerCase() === "delivered")
    .reduce((acc, cur) => acc + (Number(cur.total_cost) || 0), 0);

  // Totals for Service Delivery report
  const successfulDeliveries = filteredServiceData.filter(
    (row) => String(row.delivery_status).toLowerCase() === "delivered"
  ).length;
  const failedDeliveries = filteredServiceData.filter(
    (row) => String(row.delivery_status).toLowerCase() === "cancelled"
  ).length;
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

  const generateSalesPeriodRows = (salesData, period, startDate, endDate) => {
    const rows = [];
    const getMonthName = (monthIndex) =>
      new Date(2000, monthIndex, 1).toLocaleString("default", {
        month: "long",
      });

    const formatDate = (date) =>
      date ? new Date(date).toISOString().split("T")[0] : "";

    const addRow = (
      label,
      totalQuote,
      totalAwarded,
      totalActual,
      totalBalance
    ) => {
      rows.push([
        label,
        totalQuote.toFixed(2),
        totalAwarded.toFixed(2),
        totalActual.toFixed(2),
        totalBalance.toFixed(2),
      ]);
    };

    if (period === "annually") {
      for (let m = 0; m < 12; m++) {
        const monthSales = salesData.filter(
          (s) => new Date(s.date_of_order).getMonth() === m
        );
        const totals = monthSales.reduce(
          (acc, sale) => ({
            quote: acc.quote + sale.unit_cost * sale.qty,
            awarded: acc.awarded + sale.total_cost,
            actual: acc.actual + (sale.total_cost - sale.balance),
            balance: acc.balance + sale.balance,
          }),
          { quote: 0, awarded: 0, actual: 0, balance: 0 }
        );
        addRow(
          getMonthName(m),
          totals.quote,
          totals.awarded,
          totals.actual,
          totals.balance
        );
      }
    } else if (period === "quarterly") {
      const start = startDate ? new Date(startDate) : new Date();
      const end = endDate ? new Date(endDate) : new Date();

      // Determine the quarter months based on start date
      const month = start.getMonth();
      let quarterMonths = [];

      if (month <= 2) quarterMonths = [0, 1, 2]; // Jan-Mar
      else if (month <= 5) quarterMonths = [3, 4, 5]; // Apr-Jun
      else if (month <= 8) quarterMonths = [6, 7, 8]; // Jul-Sep
      else quarterMonths = [9, 10, 11]; // Oct-Dec

      quarterMonths.forEach((m) => {
        const monthSales = salesData.filter(
          (s) => new Date(s.date_of_order).getMonth() === m
        );

        const totals = monthSales.reduce(
          (acc, sale) => ({
            quote: acc.quote + sale.unit_cost * sale.qty,
            awarded: acc.awarded + sale.total_cost,
            actual: acc.actual + (sale.total_cost - sale.balance),
            balance: acc.balance + sale.balance,
          }),
          { quote: 0, awarded: 0, actual: 0, balance: 0 }
        );

        rows.push([
          getMonthName(m),
          totals.quote.toFixed(2),
          totals.awarded.toFixed(2),
          totals.actual.toFixed(2),
          totals.balance.toFixed(2),
        ]);
      });
    } else if (period === "monthly") {
      const start = new Date(startDate || new Date());
      const daysInMonth = new Date(
        start.getFullYear(),
        start.getMonth() + 1,
        0
      ).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${start.getFullYear()}-${String(
          start.getMonth() + 1
        ).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const daySales = salesData.filter((s) => s.date_of_order === dateStr);
        const totals = daySales.reduce(
          (acc, sale) => ({
            quote: acc.quote + sale.unit_cost * sale.qty,
            awarded: acc.awarded + sale.total_cost,
            actual: acc.actual + (sale.total_cost - sale.balance),
            balance: acc.balance + sale.balance,
          }),
          { quote: 0, awarded: 0, actual: 0, balance: 0 }
        );
        addRow(
          dateStr,
          totals.quote,
          totals.awarded,
          totals.actual,
          totals.balance
        );
      }
    } else if (period === "weekly") {
      const start = new Date(startDate || new Date());
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // Monday
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const dateStr = formatDate(d);
        const daySales = salesData.filter(
          (s) => formatDate(new Date(s.date_of_order)) === dateStr
        );
        const totals = daySales.reduce(
          (acc, sale) => ({
            quote: acc.quote + sale.unit_cost * sale.qty,
            awarded: acc.awarded + sale.total_cost,
            actual: acc.actual + (sale.total_cost - sale.balance),
            balance: acc.balance + sale.balance,
          }),
          { quote: 0, awarded: 0, actual: 0, balance: 0 }
        );
        addRow(
          dateStr,
          totals.quote,
          totals.awarded,
          totals.actual,
          totals.balance
        );
      }
    } else if (period === "daily") {
      const uniqueDates = [...new Set(salesData.map((s) => s.date_of_order))];
      uniqueDates.forEach((dateStr) => {
        const daySales = salesData.filter((s) => s.date_of_order === dateStr);
        const totals = daySales.reduce(
          (acc, sale) => ({
            quote: acc.quote + sale.unit_cost * sale.qty,
            awarded: acc.awarded + sale.total_cost,
            actual: acc.actual + (sale.total_cost - sale.balance),
            balance: acc.balance + sale.balance,
          }),
          { quote: 0, awarded: 0, actual: 0, balance: 0 }
        );
        addRow(
          dateStr,
          totals.quote,
          totals.awarded,
          totals.actual,
          totals.balance
        );
      });
    }

    // Add totals row
    const total = rows.reduce(
      (acc, r) => ({
        quote: acc.quote + parseFloat(r[1]),
        awarded: acc.awarded + parseFloat(r[2]),
        actual: acc.actual + parseFloat(r[3]),
        balance: acc.balance + parseFloat(r[4]),
      }),
      { quote: 0, awarded: 0, actual: 0, balance: 0 }
    );
    addRow("TOTAL", total.quote, total.awarded, total.actual, total.balance);

    return rows;
  };

  const generateTransactionPeriodRows = (
    transactionData,
    period,
    startDate,
    endDate
  ) => {
    const rows = [];
    const getMonthName = (monthIndex) =>
      new Date(2000, monthIndex, 1).toLocaleString("default", {
        month: "long",
      });

    const formatDate = (date) =>
      date ? new Date(date).toISOString().split("T")[0] : "";

    const pushTxRow = (label, tx) => {
      rows.push([
        label || "",
        tx.transaction_id ?? "-",
        tx.tracking_number ?? "-",
        tx.date_of_order ?? "-",
        tx.customer_name ?? "-",
        tx.customer_address ?? "-",
        tx.item_name ?? "-",
        (tx.qty ?? 0).toFixed(2),
        `₱${(tx.unit_cost ?? 0).toFixed(2)}`,
        `₱${(tx.subtotal ?? 0).toFixed(2)}`,
        tx.delivery_status ?? "-",
        tx.shipout_at ?? "-",
        tx.completed_at ?? "-",
      ]);
    };

    const pushZeroRow = (label) => {
      rows.push([
        label,
        "-",
        "-",
        "-",
        "-",
        "-",
        "-",
        "0.00",
        "0.00",
        "0.00",
        "-",
        "-",
        "-",
      ]);
    };

    // === PERIOD LOGIC (Annually, Quarterly, Monthly, Weekly, Daily) ===
    if (period === "annually") {
      for (let m = 0; m < 12; m++) {
        const monthTxs = transactionData.filter(
          (t) => new Date(t.date_of_order).getMonth() === m
        );
        if (monthTxs.length > 0) {
          rows.push([
            getMonthName(m),
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
          ]);
          monthTxs.forEach((tx) => pushTxRow("", tx));
        } else {
          pushZeroRow(getMonthName(m));
        }
      }
    } else if (period === "quarterly") {
      const start = startDate ? new Date(startDate) : new Date();
      const month = start.getMonth();
      let quarterMonths = [];
      if (month <= 2) quarterMonths = [0, 1, 2];
      else if (month <= 5) quarterMonths = [3, 4, 5];
      else if (month <= 8) quarterMonths = [6, 7, 8];
      else quarterMonths = [9, 10, 11];

      quarterMonths.forEach((m) => {
        const monthTxs = transactionData.filter(
          (t) => new Date(t.date_of_order).getMonth() === m
        );
        if (monthTxs.length > 0) {
          rows.push([
            getMonthName(m),
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
          ]);
          monthTxs.forEach((tx) => pushTxRow("", tx));
        } else {
          pushZeroRow(getMonthName(m));
        }
      });
    } else if (period === "monthly") {
      const start = new Date(startDate || new Date());
      const daysInMonth = new Date(
        start.getFullYear(),
        start.getMonth() + 1,
        0
      ).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${start.getFullYear()}-${String(
          start.getMonth() + 1
        ).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const dayTxs = transactionData.filter(
          (t) => t.date_of_order === dateStr
        );
        if (dayTxs.length > 0) {
          rows.push([dateStr, "", "", "", "", "", "", "", "", "", "", "", ""]);
          dayTxs.forEach((tx) => pushTxRow("", tx));
        } else {
          pushZeroRow(dateStr);
        }
      }
    } else if (period === "weekly") {
      const start = new Date(startDate || new Date());
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // Monday
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const dateStr = formatDate(d);
        const dayTxs = transactionData.filter(
          (t) => formatDate(new Date(t.date_of_order)) === dateStr
        );
        if (dayTxs.length > 0) {
          rows.push([dateStr, "", "", "", "", "", "", "", "", "", "", "", ""]);
          dayTxs.forEach((tx) => pushTxRow("", tx));
        } else {
          pushZeroRow(dateStr);
        }
      }
    } else if (period === "daily") {
      if (transactionData.length > 0) {
        transactionData.forEach((tx) => pushTxRow("", tx));
      } else {
        pushZeroRow(formatDate(new Date(startDate || new Date())));
      }
    }

    // === GRAND TOTAL ===
    const totals = transactionData.reduce(
      (acc, t) => ({
        qty: acc.qty + (t.qty ?? 0),
        subtotal: acc.subtotal + (t.subtotal ?? 0),
      }),
      { qty: 0, subtotal: 0 }
    );
    rows.push([
      "TOTAL",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      totals.qty.toFixed(2),
      "-",
      `${totals.subtotal.toFixed(2)}`,
      "-",
      "-",
      "-",
    ]);

    return rows;
  };

  const generateServicePeriodRows = (
    serviceData,
    period,
    startDate,
    endDate
  ) => {
    const rows = [];

    // --- Helpers ---
    const getMonthName = (monthIndex) =>
      new Date(2000, monthIndex, 1).toLocaleString("default", {
        month: "long",
      });

    const formatDate = (date) => {
      if (!date) return "-";
      const d = new Date(date);
      if (isNaN(d)) return "-"; // invalid date
      return d.toISOString().split("T")[0]; // always YYYY-MM-DD
    };

    const pushServiceRow = (label, svc) => {
      rows.push([
        label || "",
        svc.transaction_id ?? "-",
        formatDate(svc.date_of_order),
        svc.customer_name ?? "-",
        svc.delivery_status ?? "-",
        formatDate(svc.original_target_date ?? svc.target_date_delivery),
        formatDate(svc.latest_rescheduled_date ?? svc.rescheduled_date),
        svc.cancelled_reason ?? "-",
      ]);
    };

    const pushZeroRow = (label) => {
      rows.push([label, "-", "-", "-", "-", "-", "-", "-"]);
    };

    // --- Normalize all data dates once ---
    const normalizedData = serviceData.map((s) => ({
      ...s,
      date_of_order: formatDate(s.date_of_order),
    }));

    // --- Period Logic ---
    if (period === "annually") {
      for (let m = 0; m < 12; m++) {
        const monthTxs = normalizedData.filter(
          (s) => new Date(s.date_of_order).getMonth() === m
        );
        if (monthTxs.length > 0) {
          rows.push([getMonthName(m), "", "", "", "", "", "", ""]);
          monthTxs.forEach((svc) => pushServiceRow("", svc));
        } else {
          pushZeroRow(getMonthName(m));
        }
      }
    } else if (period === "quarterly") {
      const start = startDate ? new Date(startDate) : new Date();
      const month = start.getMonth();
      let quarterMonths = [];
      if (month <= 2) quarterMonths = [0, 1, 2];
      else if (month <= 5) quarterMonths = [3, 4, 5];
      else if (month <= 8) quarterMonths = [6, 7, 8];
      else quarterMonths = [9, 10, 11];

      quarterMonths.forEach((m) => {
        const monthTxs = normalizedData.filter(
          (s) => new Date(s.date_of_order).getMonth() === m
        );
        if (monthTxs.length > 0) {
          rows.push([getMonthName(m), "", "", "", "", "", "", ""]);
          monthTxs.forEach((svc) => pushServiceRow("", svc));
        } else {
          pushZeroRow(getMonthName(m));
        }
      });
    } else if (period === "monthly") {
      const start = new Date(startDate || new Date());
      const daysInMonth = new Date(
        start.getFullYear(),
        start.getMonth() + 1,
        0
      ).getDate();

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${start.getFullYear()}-${String(
          start.getMonth() + 1
        ).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

        const dayTxs = normalizedData.filter(
          (s) => s.date_of_order === dateStr
        );
        if (dayTxs.length > 0) {
          rows.push([dateStr, "", "", "", "", "", "", ""]);
          dayTxs.forEach((svc) => pushServiceRow("", svc));
        } else {
          pushZeroRow(dateStr);
        }
      }
    } else if (period === "weekly") {
      const start = new Date(startDate || new Date());
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // Monday

      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const dateStr = formatDate(d);

        const dayTxs = normalizedData.filter(
          (s) => formatDate(new Date(s.date_of_order)) === dateStr
        );
        if (dayTxs.length > 0) {
          rows.push([dateStr, "", "", "", "", "", "", ""]);
          dayTxs.forEach((svc) => pushServiceRow("", svc));
        } else {
          pushZeroRow(dateStr);
        }
      }
    } else if (period === "daily") {
      if (normalizedData.length > 0) {
        normalizedData.forEach((svc) => pushServiceRow("", svc));
      } else {
        pushZeroRow(formatDate(new Date(startDate || new Date())));
      }
    }

    // --- Summary Row ---
    const totals = normalizedData.reduce(
      (acc, s) => {
        acc.total++;
        if (s.delivery_status?.toLowerCase() === "cancelled") acc.cancelled++;
        if (s.delivery_status?.toLowerCase() === "delivered") acc.completed++;
        return acc;
      },
      { total: 0, cancelled: 0, completed: 0 }
    );

    rows.push([
      "TOTAL",
      "-",
      "-",
      "-",
      `Completed: ${totals.completed}`,
      "-",
      "-",
      `Cancelled: ${totals.cancelled} / All: ${totals.total}`,
    ]);

    return rows;
  };

  // ✅ Generate rows (WITH Item column, no double formatting)
const generateCustomerSatisfactionRows = (
  satisfactionData,
  period,
  startDate,
  endDate
) => {
  const rows = [];

  const getMonthName = (monthIndex) =>
    new Date(2000, monthIndex, 1).toLocaleString("default", {
      month: "long",
    });

  // Row builders
  const pushCustomerRow = (label, c) => {
    rows.push([
      label || "",
      c.transaction_id ?? "-",
      c.date_of_order ?? "-",
      c.customer_name ?? "-",
      c.item_name ?? "-",
      c.customer_rating != null ? `${c.customer_rating}/5` : "N/A",
      c.delivery_status ?? "-",
    ]);
  };

  const pushZeroRow = (label) => {
    rows.push([label, "-", "-", "-", "-", "-", "-"]);
  };

  // ✅ Already normalized → just use it
  const normalizedData = satisfactionData;

  // --- Period Logic ---
  if (period === "annually") {
    for (let m = 0; m < 12; m++) {
      const monthTxs = normalizedData.filter(
        (c) => new Date(c.date_of_order).getMonth() === m
      );
      if (monthTxs.length > 0) {
        rows.push([getMonthName(m), "", "", "", "", "", ""]);
        monthTxs.forEach((c) => pushCustomerRow("", c));
      } else {
        pushZeroRow(getMonthName(m));
      }
    }
  } else if (period === "quarterly") {
    const start = startDate ? new Date(startDate) : new Date();
    const month = start.getMonth();
    let quarterMonths = [];
    if (month <= 2) quarterMonths = [0, 1, 2];
    else if (month <= 5) quarterMonths = [3, 4, 5];
    else if (month <= 8) quarterMonths = [6, 7, 8];
    else quarterMonths = [9, 10, 11];

    quarterMonths.forEach((m) => {
      const monthTxs = normalizedData.filter(
        (c) => new Date(c.date_of_order).getMonth() === m
      );
      if (monthTxs.length > 0) {
        rows.push([getMonthName(m), "", "", "", "", "", ""]);
        monthTxs.forEach((c) => pushCustomerRow("", c));
      } else {
        pushZeroRow(getMonthName(m));
      }
    });
  } else if (period === "monthly") {
    const start = new Date(startDate || new Date());
    const daysInMonth = new Date(
      start.getFullYear(),
      start.getMonth() + 1,
      0
    ).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${start.getFullYear()}-${String(
        start.getMonth() + 1
      ).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

      const dayTxs = normalizedData.filter((c) => c.date_of_order === dateStr);
      if (dayTxs.length > 0) {
        rows.push([dateStr, "", "", "", "", "", ""]);
        dayTxs.forEach((c) => pushCustomerRow("", c));
      } else {
        pushZeroRow(dateStr);
      }
    }
  } else if (period === "weekly") {
    const start = new Date(startDate || new Date());
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // Monday

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];

      const dayTxs = normalizedData.filter((c) => c.date_of_order === dateStr);
      if (dayTxs.length > 0) {
        rows.push([dateStr, "", "", "", "", "", ""]);
        dayTxs.forEach((c) => pushCustomerRow("", c));
      } else {
        pushZeroRow(dateStr);
      }
    }
  } else if (period === "daily") {
    if (normalizedData.length > 0) {
      normalizedData.forEach((c) => pushCustomerRow("", c));
    } else {
      pushZeroRow(
        new Date(startDate || new Date()).toISOString().split("T")[0]
      );
    }
  }

  // --- Summary Row ---
  const totals = normalizedData.reduce(
    (acc, c) => {
      acc.total++;
      if (c.customer_rating != null) {
        acc.rated++;
        acc.ratingSum += c.customer_rating;
      }
      if (c.delivery_status?.toLowerCase() === "cancelled") acc.cancelled++;
      if (c.delivery_status?.toLowerCase() === "delivered") acc.completed++;
      return acc;
    },
    { total: 0, rated: 0, ratingSum: 0, cancelled: 0, completed: 0 }
  );

  const avgRating =
    totals.rated > 0 ? (totals.ratingSum / totals.rated).toFixed(2) : "N/A";

  rows.push([
    "TOTAL",
    "-",
    "-",
    "-",
    "-",
    `Avg Rating: ${avgRating}`,
    `Completed: ${totals.completed} / Cancelled: ${totals.cancelled} / All: ${totals.total}`,
  ]);

  return rows;
};

  const generateReport = async (reportType) => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [330.2, 215.9], // long bond paper
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const getPeriodLabel = (periodValue) => {
      const period = PERIODS.find((p) => p.value === periodValue);
      return period ? period.label : "Period";
    };

    const getTodayDate = () => {
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const year = today.getFullYear();
      return `${year}-${month}-${day}`;
    };

    const getCurrentYear = () => new Date().getFullYear();
    const formatDate = (date) =>
      date ? new Date(date).toLocaleDateString() : "";

    const getDateRangeText = () => {
      if (period === "annually") {
        const year = startDate
          ? new Date(startDate).getFullYear()
          : getCurrentYear();
        return ` (Jan 1 - Dec 31, ${year})`;
      }
      if (period === "quarterly") {
        const start = new Date(startDate || getTodayDate());
        const monthNumber = start.toISOString().slice(5, 7); // "01" to "12"
        let quarterMonths = [];

        if (monthNumber >= "01" && monthNumber <= "03")
          quarterMonths = ["January", "February", "March"];
        else if (monthNumber >= "04" && monthNumber <= "06")
          quarterMonths = ["April", "May", "June"];
        else if (monthNumber >= "07" && monthNumber <= "09")
          quarterMonths = ["July", "August", "September"];
        else quarterMonths = ["October", "November", "December"];

        return ` (${quarterMonths[0]} to ${
          quarterMonths[quarterMonths.length - 1]
        })`;
      }

      if (period === "monthly") {
        const start = new Date(startDate || getTodayDate());
        const firstDay = new Date(start.getFullYear(), start.getMonth(), 1);
        const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        return ` (${formatDate(firstDay)} - ${formatDate(lastDay)})`;
      }
      if (period === "weekly") {
        const start = new Date(startDate || getTodayDate());
        start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return ` (${formatDate(start)} - ${formatDate(end)})`;
      }
      if (period === "daily") {
        // Use startDate if provided, otherwise today
        const today = startDate ? new Date(startDate) : new Date();
        // Format as MM/DD/YYYY for display
        const formattedDay = `${String(today.getMonth() + 1).padStart(
          2,
          "0"
        )}/${String(today.getDate()).padStart(2, "0")}/${today.getFullYear()}`;
        return ` (${formattedDay})`;
      }

      return "";
    };

    const renderHeader = (title) => {
      const now = new Date();
      const generatedDate =
        now.toLocaleDateString("en-US", {
          month: "numeric",
          day: "numeric",
          year: "numeric",
        }) +
        ", " +
        now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });

      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${generatedDate}`, pageWidth - 3, 5, {
        align: "right",
      });

      let yPos = 8;
      try {
        const logoWidth = 25;
        const logoHeight = 12;
        const logoX = pageWidth / 2 - logoWidth / 2;
        if (logo) doc.addImage(logo, "PNG", logoX, yPos, logoWidth, logoHeight);
      } catch (error) {
        const logoX = pageWidth / 2 - 12.5;
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(240, 240, 240);
        doc.rect(logoX, yPos, 25, 12, "F");
      }

      yPos += 16;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Envirocool Corporation", pageWidth / 2, yPos, {
        align: "center",
      });
      yPos += 3;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Calamba Sales Office", pageWidth / 2, yPos, {
        align: "center",
      });
      yPos += 3;
      doc.setFontSize(7);
      doc.text(
        "FP Perez, Brgy. Parian, Calamba City, Laguna",
        pageWidth / 2,
        yPos,
        { align: "center" }
      );
      yPos += 3;
      doc.text("Tel: (049) 540-306 / 0917-158-7013", pageWidth / 2, yPos, {
        align: "center",
      });
      yPos += 4;
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.2);
      doc.line(15, yPos, pageWidth - 15, yPos);
      yPos += 6;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      const periodLabel = getPeriodLabel(period);
      const dateRangeText = getDateRangeText();
      doc.text(
        `${title} Report - ${periodLabel}${dateRangeText}`,
        pageWidth / 2,
        yPos,
        { align: "center" }
      );

      return yPos + 6;
    };

    const addFooter = (pageNum, totalPages) => {
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.1);
      doc.line(15, pageHeight - 8, pageWidth - 15, pageHeight - 8);

      doc.text(
        `Page ${pageNum} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 5,
        { align: "center" }
      );
    };

    const fetchSalesData = async () => {
      try {
        const res = await fetch(
          "http://localhost/DeliveryTrackingSystem/get_sales_report.php",
          { method: "GET", credentials: "include" }
        );
        if (!res.ok) throw new Error("get_sales_report failed");

        const data = await res.json();
        let normalizedSales = normalizeSales(data.sales ?? []);
        normalizedSales = normalizedSales.filter(
          (sale) => sale.delivery_status.toLowerCase() === "delivered"
        );

        return generateSalesPeriodRows(
          normalizedSales,
          period,
          startDate,
          endDate
        );
      } catch (error) {
        console.error("Error fetching sales data:", error);
        return [];
      }
    };

    const fetchTransactionData = async () => {
      try {
        const res = await fetch(
          "http://localhost/DeliveryTrackingSystem/get_transaction_report.php",
          { method: "GET", credentials: "include" }
        );
        if (!res.ok) throw new Error("get_transaction_report failed");

        const data = await res.json();
        const normalizedTransactions = normalizeTransactions(
          data.transactions ?? []
        );

        // Generate rows based on period (daily, weekly, monthly, annually)
        const transactionRows = generateTransactionPeriodRows(
          normalizedTransactions,
          period,
          startDate,
          endDate
        );

        return transactionRows;
      } catch (error) {
        console.error("Error fetching transaction data:", error);
        return [];
      }
    };

    const fetchServiceData = async () => {
      try {
        const res = await fetch(
          "http://localhost/DeliveryTrackingSystem/get_service_delivery_report.php",
          { method: "GET", credentials: "include" }
        );
        if (!res.ok) throw new Error("get_service_delivery_report failed");

        const data = await res.json();
        const normalizedService = normalizeService(
          data.serviceDeliveries ?? data.data ?? []
        );

        return generateServicePeriodRows(
          normalizedService,
          period,
          startDate,
          endDate
        );
      } catch (error) {
        console.error("Error fetching service data:", error);
        return [];
      }
    };

    const fetchCustomerSatisfactionData = async () => {
      try {
        const res = await fetch(
          "http://localhost/DeliveryTrackingSystem/get_customer_satisfaction_report.php",
          { method: "GET", credentials: "include" }
        );
        if (!res.ok) throw new Error("get_customer_satisfaction_report failed");

        const data = await res.json();
        const normalizedSatisfaction = normalizeCustomer(
          data.satisfaction ?? data.data ?? []
        );

        return generateCustomerSatisfactionRows(
          normalizedSatisfaction,
          period,
          startDate,
          endDate
        );
      } catch (error) {
        console.error("Error fetching satisfaction data:", error);
        return [];
      }
    };

    // Main report logic
    const type = (
      typeof reportType === "string" ? reportType : ""
    ).toLowerCase();

    try {
      if (type === "all") {
        const reports = [
          { title: "Sales", type: "sales" },
          { title: "Transaction", type: "transaction" },
          { title: "Delivery Service", type: "service" },
          { title: "Client Satisfaction", type: "customer" },
        ];

        for (let idx = 0; idx < reports.length; idx++) {
          const r = reports[idx];
          if (idx > 0) doc.addPage();

          const headerY = renderHeader(r.title);

          if (r.type === "sales") {
            let salesData = await fetchSalesData();
            if (period === "daily") {
              // Replace salesData with today's date row
              salesData = salesData.map((row) => [
                new Date().toLocaleDateString("en-US"), // Current day
                row.quoteAmount || "0.00",
                row.awardedAmount || "0.00",
                row.actualCollection || "0.00",
                row.balance || "0.00",
              ]);
            }
            await createSalesReportTable(
              doc,
              pageWidth,
              pageHeight,
              headerY,
              salesData,
              period
            );
          } else if (r.type === "transaction") {
            const transactionRows = await fetchTransactionData();
            await createTransactionReportTable(
              doc,
              pageWidth,
              pageHeight,
              headerY,
              transactionRows,
              period
            );
          } else if (r.type === "service") {
            const serviceRows = await fetchServiceData();
            await createDeliveryServiceReportTable(
              doc,
              pageWidth,
              pageHeight,
              headerY,
              serviceRows,
              period
            );
          } else if (r.type === "customer") {
            const satisfactionRows = await fetchCustomerSatisfactionData();
            await createCustomerSatisfactionReportTable(
              doc,
              pageWidth,
              pageHeight,
              headerY,
              satisfactionRows,
              period
            );
          } else {
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.text(
              `${r.title} content would go here...`,
              pageWidth / 2,
              headerY + 10,
              { align: "center" }
            );
          }

          addFooter(idx + 1, reports.length);
        }

        doc.save("envirocool-overall-report.pdf");
        alert(
          `Overall Report PDF (${getPeriodLabel(
            period
          )}) has been generated and downloaded successfully!`
        );
      } else {
        let title;
        switch (type) {
          case "sales":
            title = "Sales";
            break;
          case "transaction":
            title = "Transaction";
            break;
          case "service":
            title = "Delivery Service";
            break;
          case "customer":
            title = "Client Satisfaction";
            break;
          default:
            alert("Please select a report type.");
            return;
        }

        const headerY = renderHeader(title);

        if (type === "sales") {
          let salesData = await fetchSalesData();
          if (period === "daily") {
            // Replace salesData with today's date row
            salesData = salesData.map((row) => [
              new Date().toLocaleDateString("en-US"), // Current day
              row.quoteAmount || "0.00",
              row.awardedAmount || "0.00",
              row.actualCollection || "0.00",
              row.balance || "0.00",
            ]);
          }
          await createSalesReportTable(
            doc,
            pageWidth,
            pageHeight,
            headerY,
            salesData,
            period
          );
        } else if (type === "transaction") {
          const transactionRows = await fetchTransactionData();
          await createTransactionReportTable(
            doc,
            pageWidth,
            pageHeight,
            headerY,
            transactionRows,
            period
          );
        } else if (type === "service") {
          const serviceRows = await fetchServiceData();
          await createDeliveryServiceReportTable(
            doc,
            pageWidth,
            pageHeight,
            headerY,
            serviceRows,
            period
          );
        } else if (type === "customer") {
          const satisfactionRows = await fetchCustomerSatisfactionData();
          await createCustomerSatisfactionReportTable(
            doc,
            pageWidth,
            pageHeight,
            headerY,
            satisfactionRows,
            period
          );
        } else {
          doc.setFontSize(12);
          doc.setFont("helvetica", "normal");
          doc.text(
            `${title} content would go here...`,
            pageWidth / 2,
            headerY + 10,
            { align: "center" }
          );
        }

        addFooter(1, 1);

        const fileName = `envirocool-${type}-report-${period}-${getTodayDate()}.pdf`;
        doc.save(fileName);
        alert(
          `${title} Report PDF (${getPeriodLabel(
            period
          )}) has been generated and downloaded successfully!`
        );
      }
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  const createSalesReportTable = async (
    doc,
    pageWidth,
    pageHeight,
    yStartPosition,
    aggregatedData, // Now consistent with generateReport
    period
  ) => {
    let yPosition = yStartPosition;

    // Config
    const tableConfig = {
      marginLeft: 15,
      marginRight: 15,
      rowHeight: 8,
      headerHeight: 12,
      headerFontSize: 10,
      subHeaderFontSize: 9,
      cellFontSize: 8,
    };

    // Width setup (5 columns)
    const availableWidth =
      pageWidth - tableConfig.marginLeft - tableConfig.marginRight;
    const colWidths = [
      availableWidth * 0.2, // Period
      availableWidth * 0.2, // Quote
      availableWidth * 0.2, // Awarded
      availableWidth * 0.2, // Actual
      availableWidth * 0.2, // Balance
    ];

    // Helper: draw text centered
    const drawCenteredText = (text, x, y, width, fontSize) => {
      doc.setFontSize(fontSize);
      const textWidth = doc.getTextWidth(text);
      const textX = x + (width - textWidth) / 2;
      doc.text(text, textX, y, { maxWidth: width - 4 });
    };

    // ✅ Header Row 1
    doc.setFont("helvetica", "bold");

    const awardedX = tableConfig.marginLeft + colWidths[0];

    // Sales Opportunity
    doc.setFillColor(173, 216, 230);
    doc.setTextColor(0, 0, 0);
    doc.rect(
      tableConfig.marginLeft,
      yPosition,
      colWidths[0],
      tableConfig.headerHeight,
      "FD"
    );
    drawCenteredText(
      "SALES OPPORTUNITY",
      tableConfig.marginLeft,
      yPosition + 8,
      colWidths[0],
      tableConfig.headerFontSize
    );

    // Awarded Sales
    doc.setFillColor(221, 160, 221);
    doc.setTextColor(0, 0, 0);
    doc.rect(
      awardedX,
      yPosition,
      colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4],
      tableConfig.headerHeight,
      "FD"
    );
    drawCenteredText(
      "AWARDED SALES",
      awardedX,
      yPosition + 8,
      colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4],
      tableConfig.headerFontSize
    );

    yPosition += tableConfig.headerHeight;

    // ✅ Header Row 2
    doc.setFont("helvetica", "bold");
    doc.setFontSize(tableConfig.subHeaderFontSize);
    doc.setTextColor(0, 0, 0);

    // RESPONSIBLES
    doc.setFillColor(255, 255, 255);
    doc.rect(
      tableConfig.marginLeft,
      yPosition,
      colWidths[0],
      tableConfig.rowHeight,
      "FD"
    );
    drawCenteredText(
      "RESPONSIBLES",
      tableConfig.marginLeft,
      yPosition + 6,
      colWidths[0],
      tableConfig.subHeaderFontSize
    );

    // ALL
    doc.setFillColor(255, 255, 255);
    doc.rect(
      awardedX,
      yPosition,
      colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4],
      tableConfig.rowHeight,
      "FD"
    );
    drawCenteredText(
      "ALL",
      awardedX,
      yPosition + 6,
      colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4],
      tableConfig.subHeaderFontSize
    );

    yPosition += tableConfig.rowHeight;

    // ✅ Column Headers
    let periodLabel = "MONTHS";
    if (period === "monthly") periodLabel = "DAYS";
    else if (period === "weekly") periodLabel = "WEEKDAYS";
    else if (period === "daily") periodLabel = "DATE";
    else if (period === "quarterly") periodLabel = "QUARTERS";

    const headers = [
      periodLabel,
      "QUOTE AMOUNT",
      "AWARDED AMOUNT",
      "ACTUAL COLLECTION",
      "BALANCE FOR COLLECTION",
    ];
    doc.setFont("helvetica", "bold");

    let xPos = tableConfig.marginLeft;
    headers.forEach((header, i) => {
      doc.setFillColor(255, 255, 255);
      doc.rect(xPos, yPosition, colWidths[i], tableConfig.rowHeight, "FD");
      drawCenteredText(
        header,
        xPos,
        yPosition + 6,
        colWidths[i],
        tableConfig.subHeaderFontSize
      );
      xPos += colWidths[i];
    });

    yPosition += tableConfig.rowHeight;

    // ✅ Render aggregatedData rows (with page breaks)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(tableConfig.cellFontSize);

    if (Array.isArray(aggregatedData)) {
      aggregatedData.forEach((row, rowIndex) => {
        let x = tableConfig.marginLeft;

        row.forEach((cell, i) => {
          doc.setFillColor(rowIndex % 2 === 1 ? 248 : 255, 248, 248);
          doc.rect(x, yPosition, colWidths[i], tableConfig.rowHeight, "FD");
          doc.setDrawColor(0, 0, 0);
          doc.rect(x, yPosition, colWidths[i], tableConfig.rowHeight, "S");

          let displayText = cell || "";

          // Red text if Balance = 0
          if (i === 4 && parseFloat(cell) === 0) {
            doc.setTextColor(255, 0, 0);
          } else {
            doc.setTextColor(0, 0, 0);
          }

          drawCenteredText(
            displayText,
            x,
            yPosition + 6,
            colWidths[i],
            tableConfig.cellFontSize
          );
          doc.setTextColor(0, 0, 0);

          x += colWidths[i];
        });

        yPosition += tableConfig.rowHeight;

        // ✅ Page break
        if (yPosition + tableConfig.rowHeight > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
      });
    }

    return {
      finalYPosition: yPosition,
      tableHeight: yPosition - yStartPosition,
      rowCount: aggregatedData ? aggregatedData.length + 5 : 5,
    };
  };

  const createTransactionReportTable = async (
    doc,
    pageWidth,
    pageHeight,
    yStartPosition,
    transactionData,
    period // ✅ Added as parameter
  ) => {
    let yPosition = yStartPosition;

    const tableConfig = {
      marginLeft: 10,
      marginRight: 10,
      rowHeight: 8,
      headerHeight: 15,
      headerFontSize: 10,
      subHeaderFontSize: 9,
      cellFontSize: 10,
      lineSpacing: 1.2, // spacing multiplier for wrapped text
    };

    // ✅ Dynamic Filter Column Label
    let periodLabel = "MONTHS";
    if (period === "monthly") periodLabel = "DAYS";
    else if (period === "weekly") periodLabel = "WEEKDAYS";
    else if (period === "daily") periodLabel = "DATE";
    else if (period === "quarterly") periodLabel = "QUARTERS";
    else if (period === "annually") periodLabel = "MONTHS"; // fallback

    const headers = [
      periodLabel,
      "Transaction No",
      "Tracking No",
      "Date of Order",
      "Client",
      "Address",
      "Item Name",
      "Quantity",
      "Unit Cost",
      "Subtotal",
      "Delivery Status",
      "Ship Out At",
      "Completed At",
    ];

    // ===== Column Config =====
    const availableWidth =
      pageWidth - tableConfig.marginLeft - tableConfig.marginRight;

    const originalWidths = [20, 22, 20, 22, 29, 25, 25, 20, 20, 20, 25, 20, 22];
    const totalOriginal = originalWidths.reduce((a, b) => a + b, 0);
    const colWidths = originalWidths.map(
      (w) => (w / totalOriginal) * availableWidth
    );

    const tableStartX = tableConfig.marginLeft;

    // Helper: draw centered text
    const drawCenteredText = (text, x, y, width, fontSize) => {
      doc.setFontSize(fontSize);
      const textWidth = doc.getTextWidth(text);
      const textX = x + (width - textWidth) / 2;
      doc.text(text, textX, y, { maxWidth: width - 4 });
    };

    // ✅ Different background colors per header
    const headerColors = [
      [173, 216, 230], // Filter
      [221, 160, 221], // Transaction No
      [144, 238, 144], // Tracking No
      [255, 218, 185], // Date of Order
      [176, 224, 230], // Client
      [240, 230, 140], // Address
      [250, 200, 200], // Item Name
      [200, 255, 200], // Quantity
      [200, 200, 255], // Unit Cost
      [255, 200, 150], // Subtotal
      [210, 180, 140], // Delivery Status
      [135, 206, 250], // Ship Out At
      [255, 182, 193], // Completed At
    ];

    // ✅ Function to draw headers (for first page + repeated on new pages)
    const drawHeaders = () => {
      let xPos = tableStartX;
      doc.setFont("helvetica", "bold");
      headers.forEach((header, i) => {
        const fillColor = headerColors[i] || [200, 200, 200];
        doc.setFillColor(...fillColor);
        doc.setTextColor(0, 0, 0);
        doc.rect(xPos, yPosition, colWidths[i], tableConfig.headerHeight, "FD");
        drawCenteredText(
          header,
          xPos,
          yPosition + tableConfig.headerHeight / 2 + 2,
          colWidths[i],
          tableConfig.subHeaderFontSize
        );
        xPos += colWidths[i];
      });
      yPosition += tableConfig.headerHeight;
    };

    // ✅ Draw headers first time
    drawHeaders();

    // ===== Rows =====
    transactionData.forEach((row, rowIndex) => {
      let xPos = tableStartX;
      let maxLines = 1;

      const cellLinesArray = row.map((cell, i) => {
        const text = cell !== null && cell !== undefined ? cell.toString() : "";
        const lines = doc.splitTextToSize(text, colWidths[i] - 2);
        maxLines = Math.max(maxLines, lines.length);
        return lines;
      });

      // ✅ Adjust row height
      const rowHeight =
        tableConfig.cellFontSize * 0.5 * maxLines * tableConfig.lineSpacing + 2;

      // Alternate row colors
      const isEvenRow = rowIndex % 2 === 0;
      const bgColor = isEvenRow ? [245, 245, 245] : [255, 255, 255];

      row.forEach((cell, i) => {
        doc.setFillColor(...bgColor);
        doc.rect(xPos, yPosition, colWidths[i], rowHeight, "FD");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(tableConfig.cellFontSize);
        doc.text(
          cellLinesArray[i],
          xPos + 1,
          yPosition + tableConfig.cellFontSize * 0.4,
          { maxWidth: colWidths[i] - 2 }
        );
        xPos += colWidths[i];
      });

      yPosition += rowHeight;

      // ✅ Page break + redraw headers
      if (yPosition + rowHeight > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
        drawHeaders();
      }
    });

    return yPosition;
  };

  const createDeliveryServiceReportTable = async (
    doc,
    pageWidth,
    pageHeight,
    yStartPosition,
    serviceData,
    period // ✅ Added as parameter
  ) => {
    let yPosition = yStartPosition;

    const tableConfig = {
      marginLeft: 10,
      marginRight: 10,
      rowHeight: 8,
      headerHeight: 15,
      headerFontSize: 11,
      subHeaderFontSize: 10,
      cellFontSize: 10,
      lineSpacing: 1.2, // spacing multiplier for wrapped text
    };

    // ✅ Dynamic Filter Column Label
    let periodLabel = "MONTHS";
    if (period === "monthly") periodLabel = "DAYS";
    else if (period === "weekly") periodLabel = "WEEKDAYS";
    else if (period === "daily") periodLabel = "DATE";
    else if (period === "quarterly") periodLabel = "QUARTERS";
    else if (period === "annually") periodLabel = "MONTHS"; // fallback

    // ✅ Headers (new structure)
    const headers = [
      periodLabel,
      "Transaction No.",
      "Date of Order",
      "Client",
      "Delivery Status",
      "Initial Delivery Date",
      "Rescheduled Date",
      "Reason for Cancellation",
    ];

    // ===== Column Config =====
    const availableWidth =
      pageWidth - tableConfig.marginLeft - tableConfig.marginRight;

    // ✅ Adjusted widths for 8 columns (must match headers length)
    const originalWidths = [25, 28, 30, 28, 32, 32, 32, 40];
    const totalOriginal = originalWidths.reduce((a, b) => a + b, 0);
    const colWidths = originalWidths.map(
      (w) => (w / totalOriginal) * availableWidth
    );

    const tableStartX = tableConfig.marginLeft;

    // Helper: draw centered text
    const drawCenteredText = (text, x, y, width, fontSize) => {
      doc.setFontSize(fontSize);
      const textWidth = doc.getTextWidth(text);
      const textX = x + (width - textWidth) / 2;
      doc.text(text, textX, y, { maxWidth: width - 4 });
    };

    // ✅ Different background colors per header (8 colors)
    const headerColors = [
      [173, 216, 230], // Filter (periodLabel)
      [221, 160, 221], // Transaction No.
      [144, 238, 144], // Date of Order
      [255, 218, 185], // Client
      [176, 224, 230], // Delivery Status
      [240, 230, 140], // Initial Delivery Date
      [250, 200, 200], // Rescheduled Date
      [255, 182, 193], // Reason for Cancellation
    ];

    // ✅ Function to draw headers (first page + repeated on new pages)
    const drawHeaders = () => {
      let xPos = tableStartX;
      doc.setFont("helvetica", "bold");
      headers.forEach((header, i) => {
        const fillColor = headerColors[i] || [200, 200, 200];
        doc.setFillColor(...fillColor);
        doc.setTextColor(0, 0, 0);
        doc.rect(xPos, yPosition, colWidths[i], tableConfig.headerHeight, "FD");
        drawCenteredText(
          header,
          xPos,
          yPosition + tableConfig.headerHeight / 2 + 3,
          colWidths[i],
          tableConfig.subHeaderFontSize
        );
        xPos += colWidths[i];
      });
      yPosition += tableConfig.headerHeight;
    };

        // ✅ Draw headers first time
    drawHeaders();

    // ===== Rows =====
    serviceData.forEach((row, rowIndex) => {
      let xPos = tableStartX;
      let maxLines = 1;

      // Split text into lines per cell
      const cellLinesArray = row.map((cell, i) => {
        const text = cell !== null && cell !== undefined ? cell.toString() : "";
        const lines = doc.splitTextToSize(text, colWidths[i] - 2);
        maxLines = Math.max(maxLines, lines.length);
        return lines;
      });

      // ✅ Adjust row height dynamically
      const rowHeight =
        maxLines * tableConfig.cellFontSize * tableConfig.lineSpacing * 0.5 + 4;

      // Alternate row colors
      const isEvenRow = rowIndex % 2 === 0;
      const bgColor = isEvenRow ? [245, 245, 245] : [255, 255, 255];

      // Draw row
      row.forEach((cell, i) => {
        doc.setFillColor(...bgColor);
        doc.rect(xPos, yPosition, colWidths[i], rowHeight, "FD");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(tableConfig.cellFontSize);
        doc.text(cellLinesArray[i], xPos + 1, yPosition + 5, {
          maxWidth: colWidths[i] - 2,
        });
        xPos += colWidths[i];
      });

      yPosition += rowHeight;

      // ✅ Page break + redraw headers
      if (yPosition + rowHeight > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
        drawHeaders();
      }
    });

    return yPosition;
  };

 // ================== CUSTOMER SATISFACTION REPORT TABLE ==================
const createCustomerSatisfactionReportTable = async (
  doc,
  pageWidth,
  pageHeight,
  yStartPosition,
  satisfactionRows,
  period
) => {
  let yPosition = yStartPosition;

  const tableConfig = {
    marginLeft: 10,
    marginRight: 10,
    rowHeight: 8,
    headerHeight: 15,
    headerFontSize: 11,
    subHeaderFontSize: 10,
    cellFontSize: 10,
    lineSpacing: 1.2,
  };

  // ✅ Dynamic Filter Column Label
  let periodLabel = "MONTHS";
  if (period === "monthly") periodLabel = "DAYS";
  else if (period === "weekly") periodLabel = "WEEKDAYS";
  else if (period === "daily") periodLabel = "DATE";
  else if (period === "quarterly") periodLabel = "QUARTERS";
  else if (period === "annually") periodLabel = "MONTHS";

  const headers = [
    periodLabel,
    "Transaction No.",
    "Date of Order",
    "Client",
    "Item",
    "Customer Rating",
    "Delivery Status",
  ];

  // ===== Column Config =====
  const availableWidth =
    pageWidth - tableConfig.marginLeft - tableConfig.marginRight;

  const originalWidths = [20, 25, 30, 30, 30, 25, 30];
  const totalOriginal = originalWidths.reduce((a, b) => a + b, 0);
  const colWidths = originalWidths.map(
    (w) => (w / totalOriginal) * availableWidth
  );

  const tableStartX = tableConfig.marginLeft;

  const drawCenteredText = (text, x, y, width, fontSize) => {
    doc.setFontSize(fontSize);
    const textWidth = doc.getTextWidth(text);
    const textX = x + (width - textWidth) / 2;
    doc.text(text, textX, y, { maxWidth: width - 4 });
  };

  const headerColors = [
    [173, 216, 230],
    [221, 160, 221],
    [255, 250, 205],
    [144, 238, 144],
    [255, 182, 193],
    [255, 218, 185],
    [176, 224, 230],
  ];

  const drawHeaders = () => {
    let xPos = tableStartX;
    doc.setFont("helvetica", "bold");
    headers.forEach((header, i) => {
      const fillColor = headerColors[i] || [200, 200, 200];
      doc.setFillColor(...fillColor);
      doc.setTextColor(0, 0, 0);
      doc.rect(xPos, yPosition, colWidths[i], tableConfig.headerHeight, "FD");
      drawCenteredText(
        header,
        xPos,
        yPosition + tableConfig.headerHeight / 2 + 3,
        colWidths[i],
        tableConfig.subHeaderFontSize
      );
      xPos += colWidths[i];
    });
    yPosition += tableConfig.headerHeight;
  };

  // ✅ Draw headers first time
  drawHeaders();

  // ===== Rows =====
  satisfactionRows.forEach((row, rowIndex) => {
    let xPos = tableStartX;
    let maxLines = 1;

    const cellLinesArray = row.map((cell, i) => {
      const text = cell !== null && cell !== undefined ? cell.toString() : "";
      const lines = doc.splitTextToSize(text, colWidths[i] - 2);
      maxLines = Math.max(maxLines, lines.length);
      return lines;
    });

    const rowHeight =
      maxLines * tableConfig.cellFontSize * tableConfig.lineSpacing * 0.5 + 4;

    const isEvenRow = rowIndex % 2 === 0;
    const bgColor = isEvenRow ? [245, 245, 245] : [255, 255, 255];

    // ✅ Page break check BEFORE drawing row
    if (yPosition + rowHeight > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
      drawHeaders();
    }

    row.forEach((cell, i) => {
      doc.setFillColor(...bgColor);
      doc.rect(xPos, yPosition, colWidths[i], rowHeight, "FD");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(tableConfig.cellFontSize);
      doc.text(cellLinesArray[i], xPos + 1, yPosition + 5, {
        maxWidth: colWidths[i] - 2,
      });
      xPos += colWidths[i];
    });

    yPosition += rowHeight;
  });

  return yPosition;
};

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
              className="card-total p-3 2"
              style={{ backgroundColor: "white" }}
            >
              <div className="d-flex align-items-center">
                <div style={{ ...iconStyle, backgroundColor: "#4CAF50" }}>
                  <FaDollarSign />
                </div>
                <div>
                  <h6 className="fw-semibold">Total Sales</h6>
                  <p className="mb-0 fw-semibold">
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
              className="card-total p-3 mb-1"
              style={{ backgroundColor: "white" }}
            >
              <div className="d-flex align-items-center">
                <div style={{ ...iconStyle, backgroundColor: "#2196F3" }}>
                  <FaUsers />
                </div>
                <div>
                  <h6 className="fw-semibold">Total Clients</h6>
                  <p className="mb-0 fw-semibold">
                    {totalCustomersTransaction}
                  </p>
                </div>
              </div>
            </Card>
          </Col>
          <Col md={3}>
            <Card
              className="card-total p-3 mb-1"
              style={{ backgroundColor: "white" }}
            >
              <div className="d-flex align-items-center">
                <div style={{ ...iconStyle, backgroundColor: "#FF9800" }}>
                  <FaBoxes />
                </div>
                <div>
                  <h6 className="fw-semibold">Total Items Sold</h6>
                  <p className="mb-0 fw-semibold">{totalItemsTransaction}</p>
                </div>
              </div>
            </Card>
          </Col>
          <Col md={3}>
            <Card
              className="card-total p-3 mb-1"
              style={{ backgroundColor: "white" }}
            >
              <div className="d-flex align-items-center">
                <div style={{ ...iconStyle, backgroundColor: "#9C27B0" }}>
                  <FaClipboardList />
                </div>
                <div>
                  <h6 className="fw-semibold">Total Transactions</h6>
                  <p className="mb-0 fw-semibold">{totalTransactions}</p>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      );
    }

    if (reportType === "sales" || reportType === "all") {
      return (
        <Row className="mb-1">
          <Col md={4}>
            <Card
              className="card-total p-3 mb-1"
              style={{ backgroundColor: "white" }}
            >
              <div className="d-flex align-items-center">
                <div style={{ ...iconStyle, backgroundColor: "#4CAF50" }}>
                  <FaDollarSign />
                </div>
                <div>
                  <h6 className="fw-semibold">Total Sales</h6>
                  <p className="mb-0 fw-semibold">
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
              className="card-total p-3 mb-1"
              style={{ backgroundColor: "white" }}
            >
              <div className="d-flex align-items-center">
                <div style={{ ...iconStyle, backgroundColor: "#2196F3" }}>
                  <FaUsers />
                </div>
                <div>
                  <h6 className="fw-semibold">Total Clients</h6>
                  <p className="mb-0 fw-semibold">{totalCustomersSales}</p>
                </div>
              </div>
            </Card>
          </Col>
          <Col md={4}>
            <Card
              className="card-total p-3 mb-1"
              style={{ backgroundColor: "white" }}
            >
              <div className="d-flex align-items-center">
                <div style={{ ...iconStyle, backgroundColor: "#FF9800" }}>
                  <FaBoxes />
                </div>
                <div>
                  <h6 className="fw-semibold">Total Items Sold</h6>
                  <p className="mb-0 fw-semibold">{totalItemsSold}</p>
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
      <Row className="mb-2 fw-semibold">
        <Col md={4}>
          <Card
            className="card-total p-3 mb-1"
            style={{ backgroundColor: "white" }}
          >
            <div className="d-flex align-items-center">
              <div style={{ ...iconStyle, backgroundColor: "#4CAF50" }}>
                <FaCheckCircle />
              </div>
              <div>
                <h6 className="fw-semibold">Successful Deliveries</h6>
                <p className="mb-0">{successfulDeliveries}</p>
              </div>
            </div>
          </Card>
        </Col>
        <Col md={4}>
          <Card
            className="card-total p-3 mb-1"
            style={{ backgroundColor: "white" }}
          >
            <div className="d-flex align-items-center">
              <div style={{ ...iconStyle, backgroundColor: "#E57373" }}>
                <FaTimesCircle />
              </div>
              <div>
                <h6 className="fw-semibold">Rescheduled Deliveries</h6>
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
                <h6 className="fw-semibold">Total Transactions</h6>
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
          <Button
            variant="danger"
            className="btn cancel-btn px-3 py-2 rounded"
            onClick={() => generateReport(reportType)}
          >
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
