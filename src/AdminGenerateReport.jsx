import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { FaPlus, FaFilePdf } from "react-icons/fa";
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
import { Table, ToggleButtonGroup, ToggleButton } from "react-bootstrap";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import EnvLogo from "./assets/env-logo.png"; // logo in src

const MonitorDelivery = () => {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState("monthly");
  const reportRef = useRef(null);

  const [summary, setSummary] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [topSellingItems, setTopSellingItems] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchSummary();
    fetchTransactions();
    fetchTopSelling();
  }, [reportType]);

  useEffect(() => {
    generateChartData();
  }, [transactions, reportType]);

  const fetchSummary = async () => {
    try {
      const res = await fetch(
        `http://localhost/DeliveryTrackingSystem/get_summary.php?type=${reportType}`
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
        `http://localhost/DeliveryTrackingSystem/get_transactions.php?type=${reportType}`
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
        `http://localhost/DeliveryTrackingSystem/get_topselling.php`
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

  // ---------- PDF (B&W tables + colored charts; centered uncompressed logo; header fix for the 1st table) ----------
  const generatePDF = async () => {
    if (!reportRef.current) return;

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginX = 12;

    const ts = new Date().toLocaleString();
    let cursorY = 10;

    // ---- HEADER: logo, title, address, timestamp, underline ----
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

    // title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Calamba Sales Office", pageWidth / 2, cursorY + 2, {
      align: "center",
    });

    // address (reduced font size by 1px → 9)
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

    // timestamp
    pdf.setFontSize(7.5);
    pdf.text(`Generated: ${ts}`, pageWidth - marginX, cursorY + 2, {
      align: "right",
    });

    // underline
    const lineY = addrStartY + 14;
    pdf.setLineWidth(0.3);
    pdf.line(marginX, lineY, pageWidth - marginX, lineY);

    const yOffset = lineY + 6;

    // ---- CLONE REPORT CONTENT ----
    const src = reportRef.current;
    const tmp = document.createElement("div");
    tmp.style.position = "fixed";
    tmp.style.left = "-10000px";
    tmp.style.top = "0";
    tmp.style.width = src.offsetWidth + "px";
    tmp.className = "__bw-scope";

    const clone = src.cloneNode(true);

    // fix delivery summary header
    try {
      const summaryBlock = clone.querySelector(".report table");
      if (summaryBlock) {
        const thead = summaryBlock.querySelector("thead");
        if (thead) {
          const newThead = document.createElement("thead");
          const tr = document.createElement("tr");
          const cells = [
            "Successful Deliveries",
            "Failed Deliveries",
            reportType === "daily" ? "Daily Deliveries" : "Monthly Deliveries",
            "Customer Satisfaction",
            "Customer Didn't Receive",
            "Damaged Item",
          ];
          cells.forEach((txt) => {
            const th = document.createElement("th");
            th.textContent = txt;
            tr.appendChild(th);
          });
          newThead.appendChild(tr);
          thead.replaceWith(newThead);
        }
      }
    } catch (e) {
      console.warn("Header normalize failed:", e);
    }

    // force B&W tables, hide charts here
    const bwCss = `
      .__bw-scope, .__bw-scope * {
        color: #000 !important;
        background: #fff !important;
        box-shadow: none !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .__bw-scope .chart-capture { visibility: hidden !important; }
      .__bw-scope .border,
      .__bw-scope .shadow-sm,
      .__bw-scope .report {
        border: none !important;
        box-shadow: none !important;
        background: #fff !important;
      }
      .__bw-scope table,
      .__bw-scope thead th,
      .__bw-scope tbody td {
        border: 1px solid #000 !important;
        border-collapse: collapse !important;
        background: #fff !important;
        color: #000 !important;
      }
      .__bw-scope thead th { font-weight: 700 !important; }
      .__bw-scope table.table-hover tbody tr:hover {
        background: #fff !important;
      }

       .__bw-scope .no-print {
    display: none !important;
    visibility: hidden !important;
  }
    `;
    const style = document.createElement("style");
    style.type = "text/css";
    style.appendChild(document.createTextNode(bwCss));
    tmp.appendChild(style);
    tmp.appendChild(clone);
    document.body.appendChild(tmp);

    // ---- RENDER B&W CONTENT ----
    const bwCanvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const bwImg = bwCanvas.toDataURL("image/jpeg", 0.8);
    const bwProps = pdf.getImageProperties(bwImg);
    const scaleW = pageWidth / clone.offsetWidth;
    const bwImgHeight = (bwProps.height * pageWidth) / bwProps.width;

    const footerGap = 40; // mm reserved at bottom
    const usableHeight = pageHeight - yOffset - footerGap;

    pdf.addImage(bwImg, "PNG", 0, yOffset, pageWidth, bwImgHeight);

    let remaining = bwImgHeight - (pageHeight - yOffset);
    let posY = yOffset - bwImgHeight + usableHeight;

    while (remaining > 0) {
      pdf.addPage();
      pdf.addImage(bwImg, "PNG", 0, posY, pageWidth, bwImgHeight);

      remaining -= usableHeight;
      posY -= usableHeight;
    }

    // ---- OVERLAY BOTH CHARTS ----
    const cloneRect = clone.getBoundingClientRect();
    const cloneCharts = Array.from(clone.querySelectorAll(".chart-capture"));
    const liveCharts = Array.from(document.querySelectorAll(".chart-capture")); // now includes Top Selling + Total Transactions

    for (let i = 0; i < cloneCharts.length; i++) {
      const ph = cloneCharts[i];
      const live = liveCharts[i];
      if (!ph || !live) continue;

      const r = ph.getBoundingClientRect();
      const relX = r.left - cloneRect.left;
      const relY = r.top - cloneRect.top;

      const chartX = relX * scaleW;
      const chartYTotal = yOffset + relY * scaleW;
      const chartW = r.width * scaleW;
      const chartH = r.height * scaleW;

      const targetPage = Math.floor(chartYTotal / pageHeight) + 1;
      const chartYOnPage = chartYTotal - (targetPage - 1) * pageHeight;

      const chartCanvas = await html2canvas(live, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const chartImg = chartCanvas.toDataURL("image/jpeg", 0.8);

      pdf.setPage(targetPage);
      pdf.addImage(chartImg, "PNG", chartX, chartYOnPage, chartW, chartH);
    }

    // ---- SIGNATURE ----
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);

      // signature footer only on last page
      if (i === pageCount) {
        const sigWidth = 60;
        const sigY = pageHeight - 30; // always fixed from bottom
        const sigX1 = (pageWidth - sigWidth) / 2;
        const sigX2 = (pageWidth + sigWidth) / 2;

        pdf.setLineWidth(0.5);
        pdf.line(sigX1, sigY, sigX2, sigY);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.text("Janine Envirocool", pageWidth / 2, sigY + 8, {
          align: "center",
        });
        pdf.text("Sales Manager", pageWidth / 2, sigY + 12, {
          align: "center",
          setFontSize: 9,
        });
      }

      // page number footer (every page)
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(8);
      pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, {
        align: "center",
      });
    }

    pdf.save(`${reportType}-overall-report.pdf`);
    document.body.removeChild(tmp);
  };

  return (
    <AdminLayout title="Generate Report">
      {/* ADD DELIVERY BUTTON (not printed) */}
      <div className="text-end mx-4 my-5 d-flex justify-content-end no-print">
        <button
          className="add-delivery rounded-2 px-3 py-2 fs-6 d-flex align-items-center gap-2"
          onClick={() => navigate("/add-delivery")}
        >
          <FaPlus /> Add New Delivery
        </button>
      </div>

      {/* TOGGLE  */}

      {/* === REPORT CONTENT TO PRINT (tables live here) === */}
      <div ref={reportRef} className="bg-white p-4 rounded shadow-sm">
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
              variant="outline-success"
            >
              Daily Report
            </ToggleButton>
            <ToggleButton
              id="tbg-btn-2"
              value="monthly"
              variant="outline-success"
            >
              Monthly Report
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
        {/* DELIVERY SUMMARY TABLE (unchanged UI) */}
        <div
          className="report p-4 rounded mb-5 border"
          style={{ background: "rgb(246, 251, 246)" }}
        >
          <h5 className="text-success h3 mb-3 text-center">
            {reportType === "daily" ? "Daily" : "Monthly"} Delivery Summary
          </h5>
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

        {/* TRANSACTIONS TABLE (unchanged UI) */}
        <div
          className="report p-4 rounded border text-center"
          style={{ background: "rgb(246, 251, 246)" }}
        >
          <h5 className="text-success h3 mb-3">
            {reportType === "daily" ? "Daily" : "Monthly"} Transactions
          </h5>
          <Table bordered hover>
            <thead className="report-header">
              <tr>
                <th>Transaction No.</th>
                {reportType === "monthly" && <th>Date</th>}
                <th>Customer Name</th>
                <th>Item Name</th>
                <th>Item Quantity</th>
                <th>Total Amount (₱)</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, index) => (
                <tr key={index}>
                  <td>{t.transaction_id}</td>
                  {reportType === "monthly" && <td>{t.date_of_order}</td>}
                  <td>{t.customer_name}</td>
                  <td>{t.item_name}</td>
                  <td>{t.item_quantity}</td>
                  <td>{(t.total || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        {/* TOP SELLING ITEMS - Monthly (unchanged UI) */}
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

        {/* ANALYTICS CHART (Successful vs Cancelled) */}
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

      {/* PDF button (not printed) */}
      <div className="text-end mt-3 no-print">
        <button className="floating-pdf-btn" onClick={generatePDF}>
          <FaFilePdf /> Generate Full PDF Report
        </button>
      </div>
    </AdminLayout>
  );
};

export default MonitorDelivery;
