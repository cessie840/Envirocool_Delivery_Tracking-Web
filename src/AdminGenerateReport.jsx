import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { FaPlus, FaFilePdf, FaCalendarAlt } from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Table, ToggleButtonGroup, ToggleButton, Form, InputGroup } from "react-bootstrap";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import EnvLogo from "./assets/env-logo.png";

const MonitorDelivery = () => {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState("monthly");
  const reportRef = useRef(null);

  const [summary, setSummary] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [topSellingItems, setTopSellingItems] = useState([]);
  const [chartData, setChartData] = useState([]);

  // Date filter state
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(reportType === "daily" ? 0 : 0, reportType === "daily" ? 10 : 7);
  });

  useEffect(() => {
    // Reset date filter when report type changes
    const today = new Date();
    setSelectedDate(
      reportType === "daily"
        ? today.toISOString().slice(0, 10)
        : today.toISOString().slice(0, 7)
    );
  }, [reportType]);

  useEffect(() => {
    fetchSummary();
    fetchTransactions();
    fetchTopSelling();
  }, [reportType, selectedDate]);

  useEffect(() => {
    generateChartData();
  }, [transactions, reportType]);

  const fetchSummary = async () => {
    try {
      const res = await fetch(
        `http://localhost/DeliveryTrackingSystem/get_summary.php?type=${reportType}&date=${selectedDate}`
      );
      const data = await res.json();
      setSummary(data || {});
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch(
        `http://localhost/DeliveryTrackingSystem/get_transactions.php?type=${reportType}&date=${selectedDate}`
      );
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTopSelling = async () => {
    if (reportType !== "monthly") {
      setTopSellingItems([]);
      return;
    }
    try {
      const res = await fetch(
        `http://localhost/DeliveryTrackingSystem/get_topselling.php?month=${selectedDate}`
      );
      const data = await res.json();
      setTopSellingItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const generateChartData = () => {
    const grouped = {};
    transactions.forEach((t) => {
      if (!t.date_of_order) return;
      const key =
        reportType === "monthly"
          ? t.date_of_order.slice(0, 7)
          : t.date_of_order;
      if (!grouped[key])
        grouped[key] = { name: key, Successful: 0, Cancelled: 0 };
      if (t.status === "Delivered") grouped[key].Successful += 1;
      else if (t.status === "Cancelled") grouped[key].Cancelled += 1;
    });
    setChartData(
      Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name))
    );
  };

  const generatePDF = async () => {
    if (!reportRef.current) return;

    const clone = reportRef.current.cloneNode(true);
    clone.style.position = "fixed";
    clone.style.top = "-9999px";
    clone.style.left = "-9999px";
    clone.style.width = `${reportRef.current.offsetWidth}px`;
    document.body.appendChild(clone);

    const pdfStyle = document.createElement("style");
    pdfStyle.innerHTML = `
      .pdf-export, .pdf-export .report, .pdf-export .p-4, .pdf-export .rounded,
      .pdf-export .shadow-sm, .pdf-export .border, .pdf-export .bg-white {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .pdf-export table {
        background: transparent !important;
        border-collapse: collapse !important;
      }
      .pdf-export th, .pdf-export td {
        background: #fff !important;
        color: #000 !important;
        border-width: 1px !important;
        border-style: solid !important;
        border-color: #000 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .pdf-export thead .report-header th {
        background: #fff !important;
        color: #000 !important;
        border-width: 1px !important;
        border-style: solid !important;
        border-color: #000 !important;
      }
      .pdf-export h1, .pdf-export h2, .pdf-export h3, .pdf-export h4, .pdf-export h5,
      .pdf-export .text-success, .pdf-export .h3, .pdf-export .h4,
      .pdf-export .text-secondary, .pdf-export {
        color: #000 !important;
      }
      .pdf-export [style*="color"] {
        color: #000 !important;
      }
      .pdf-export [style*="background"], .pdf-export [style*="background-color"] {
        background: transparent !important;
      }
      .pdf-export .no-print { display: none !important; }
      .pdf-export .chart-capture {
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
      }
    `;
    document.head.appendChild(pdfStyle);
    clone.classList.add("pdf-export");

    await new Promise((res) => setTimeout(res, 50));

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginX = 12;
    const footerGap = 40;
    const usableHeight = pageHeight - footerGap;

    const ts = new Date().toLocaleString();
    let cursorY = 10;

    try {
      const blob = await (await fetch(EnvLogo)).blob();
      const reader = new FileReader();
      const base64Logo = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });

      const img = new Image();
      img.src = base64Logo;
      await img.decode();

      const naturalRatio = img.naturalWidth / img.naturalHeight || 1;
      const maxW = 40;
      const logoW = Math.min(maxW, pageWidth - 2 * marginX);
      const logoH = logoW / naturalRatio;
      const logoX = (pageWidth - logoW) / 2;

      pdf.addImage(base64Logo, "PNG", logoX, cursorY, logoW, logoH);
      cursorY += logoH + 3;
    } catch (e) {
      console.warn("Logo load failed:", e);
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Calamba Sales Office", pageWidth / 2, cursorY + 2, {
      align: "center",
    });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    const addrStartY = cursorY + 7;
    pdf.text("FP Perez B2, Brgy. Parian", pageWidth / 2, addrStartY, {
      align: "center",
    });
    pdf.text("Calamba City, Laguna", pageWidth / 2, addrStartY + 5, {
      align: "center",
    });
    pdf.text(
      "(049) 540-306  /  0917-158-7013",
      pageWidth / 2,
      addrStartY + 10,
      { align: "center" }
    );

    pdf.setFontSize(7.5);
    pdf.text(`Generated: ${ts}`, pageWidth - marginX, cursorY + 2, {
      align: "right",
    });

    const lineY = addrStartY + 14;
    pdf.setLineWidth(0.3);
    pdf.line(marginX, lineY, pageWidth - marginX, lineY);
    cursorY = lineY + 6;

    const sections = Array.from(clone.children);

    for (const section of sections) {
      if (section.classList && section.classList.contains("no-print")) continue;

      const canvas = await html2canvas(section, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
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

      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(8);
      pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, {
        align: "center",
      });

      if (i === pageCount) {
        const sigWidth = 60;
        const sigY = pageHeight - 30;
        const sigX1 = (pageWidth - sigWidth) / 2;
        const sigX2 = (pageWidth + sigWidth) / 2;

        pdf.setLineWidth(0.5);
        pdf.line(sigX1, sigY, sigX2, sigY);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.text("Janine Envirocool", pageWidth / 2, sigY + 8, {
          align: "center",
        });
        pdf.setFontSize(9);
        pdf.text("Sales Manager", pageWidth / 2, sigY + 12, {
          align: "center",
        });
      }
    }

    pdf.save(`${reportType}-overall-report.pdf`);

    document.body.removeChild(clone);
    pdfStyle.remove();
  };

  // Date filter label
  const getDateLabel = () => {
    return reportType === "daily" ? "Date" : "Month";
  };

  // Date filter input type
  const getDateInputType = () => {
    return reportType === "daily" ? "date" : "month";
  };

  // Date filter display for summary header
  const getDisplayDate = () => {
    if (reportType === "daily") {
      const d = new Date(selectedDate);
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } else {
      const [year, month] = selectedDate.split("-");
      return `${new Date(selectedDate + "-01").toLocaleString(undefined, {
        month: "long",
      })} ${year}`;
    }
  };

  return (
    <AdminLayout title="Generate Report">
      <div className="text-end mx-4 my-5 d-flex justify-content-end no-print">
        <button
          className="add-delivery rounded-2 px-3 py-2 fs-6 d-flex align-items-center gap-2"
          onClick={() => navigate("/add-delivery")}
        >
          <FaPlus /> Add New Delivery
        </button>
      </div>

      {/* Date filter outside the container, right aligned */}
      <div className="d-flex justify-content-end align-items-center mb-3 no-print" style={{marginRight: "2.5rem"}}>
        <InputGroup style={{ maxWidth: 250 }}>
          <InputGroup.Text className="bg-white border-end-0">
            <FaCalendarAlt className="text-success" />
          </InputGroup.Text>
          <Form.Control
            type={getDateInputType()}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border-start-0"
            style={{
              background: "#f6fbf6",
              borderColor: "#cfe8cf",
              fontWeight: "500",
            }}
          />
        </InputGroup>
      </div>

      <div ref={reportRef} className="bg-white p-4 rounded shadow-sm">
        {/* Toggle buttons inside the container, centered */}
        <div className="d-flex justify-content-center mb-4 no-print">
          <ToggleButtonGroup
            type="radio"
            name="reportType"
            value={reportType}
            onChange={(val) => setReportType(val)}
          >
            <ToggleButton
              id="tbg-btn-1"
              value="daily"
              variant={reportType === "daily" ? "success" : "outline-success"}
              className="px-4"
            >
              Daily Report
            </ToggleButton>
            <ToggleButton
              id="tbg-btn-2"
              value="monthly"
              variant={reportType === "monthly" ? "success" : "outline-success"}
              className="px-4"
            >
              Monthly Report
            </ToggleButton>
          </ToggleButtonGroup>
        </div>

        <div
          className="report p-4 rounded mb-5 border"
          style={{ background: "rgb(246, 251, 246)" }}
        >
          <h5 className="text-success h3 mb-3 text-center">
            {reportType === "daily" ? "Daily" : "Monthly"} Delivery Summary
          </h5>
          <div className="mb-2 text-center fw-bold text-secondary" style={{fontSize:"1.1rem"}}>
            {getDisplayDate()}
          </div>
          <Table bordered hover className="align-middle text-center">
            <thead className="report-header">
              <tr>
                <th rowSpan={2}>Successful Deliveries</th>
                <th rowSpan={2}>Failed Deliveries</th>
                <th rowSpan={2}>
                  {reportType === "daily"
                    ? "Daily Deliveries"
                    : "Monthly Deliveries"}
                </th>
                <th rowSpan={2}>Customer Satisfaction</th>
                <th colSpan={2}>Failed Delivery Reason</th>
              </tr>
              <tr>
                <th>Customer Didn't Receive</th>
                <th>Damaged Item</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{summary.successful_deliveries || 0}</td>
                <td>{summary.failed_deliveries || 0}</td>
                <td>
                  {summary.total ||
                    Number(summary.successful_deliveries || 0) +
                      Number(summary.failed_deliveries || 0)}
                </td>
                <td>{summary.avg_rating ?? "N/A"}</td>
                <td>{summary.reason_customer_didnt_receive || 0}</td>
                <td>{summary.reason_damaged_item || 0}</td>
              </tr>
            </tbody>
          </Table>
        </div>

        <div
          className="report p-4 rounded border text-center"
          style={{ background: "rgb(246, 251, 246)" }}
        >
          <h5 className="text-success h3 mb-3">
            {reportType === "daily" ? "Daily" : "Monthly"} Transactions
          </h5>
          <div className="mb-2 text-center fw-bold text-secondary" style={{fontSize:"1.1rem"}}>
            {getDisplayDate()}
          </div>
          <Table bordered hover>
            <thead className="report-header">
              <tr>
                <th>Transaction No.</th>
                {reportType === "monthly" && <th>Date</th>}
                <th>Customer Name</th>
                <th>Item Name</th>
                <th>Item Quantity</th>
                <th>Total Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={reportType === "monthly" ? 7 : 6}>
                    No transactions found for {getDisplayDate()}.
                  </td>
                </tr>
              ) : (
                transactions.map((t, index) => (
                  <tr key={index}>
                    <td>{t.transaction_id}</td>
                    {reportType === "monthly" && <td>{t.date_of_order}</td>}
                    <td>{t.customer_name}</td>
                    <td>{t.item_name}</td>
                    <td>{t.item_quantity}</td>
                    <td>
                      <span style={{ fontWeight: "bold", color: "#388e3c" }}>
                        ₱{(t.total || 0).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          color:
                            t.status === "Delivered"
                              ? "#388e3c"
                              : t.status === "Pending" || t.status === "Out for Delivery"
                              ? "#fbc02d"
                              : t.status === "Cancelled"
                              ? "#e57373"
                              : "#333"
                        }}
                      >
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>

        {reportType === "monthly" && (
          <div
            className="p-4 rounded mb-5 mt-5 border"
            style={{ background: "#f6fbf6" }}
          >
            <h5 className="text-success mb-3 text-center h4">
              Top Selling Items (Monthly)
            </h5>
            <div className="chart-capture">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topSellingItems}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cfe8cf" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sales" fill="#4CAF50" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div
          className="p-4 rounded mb-5 mt-5 border"
          style={{ background: "#f6fbf6" }}
        >
          <h5 className="text-success mb-3 text-center h4">
            Total Deliveries (Successful and Failed)
          </h5>
          <div className="chart-capture">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cfe8cf" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="Successful"
                  fill="#4CAF50"
                  radius={[5, 5, 0, 0]}
                />
                <Bar dataKey="Cancelled" fill="#E57373" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="text-end mt-3 no-print">
        <button className="floating-pdf-btn" onClick={generatePDF}>
          <FaFilePdf /> Generate Full PDF Report
        </button>
      </div>
    </AdminLayout>
  );
};

export default MonitorDelivery;