import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import {
  FaPlus,
  FaFilePdf,
} from "react-icons/fa";
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

const MonitorDelivery = () => {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState("monthly");
  const reportRef = useRef(null);

  const monthlyData = [
    { name: "Jan", Successful: 91, Cancelled: 66 },
    { name: "Feb", Successful: 92, Cancelled: 22 },
    { name: "Mar", Successful: 100, Cancelled: 21 },
    { name: "Apr", Successful: 75, Cancelled: 55 },
    { name: "May", Successful: 55, Cancelled: 57 },
    { name: "Jun", Successful: 136, Cancelled: 55 },
    { name: "Jul", Successful: 98, Cancelled: 71 },
    { name: "Aug", Successful: 84, Cancelled: 32 },
    { name: "Sep", Successful: 122, Cancelled: 33 },
    { name: "Oct", Successful: 58, Cancelled: 35 },
    { name: "Nov", Successful: 132, Cancelled: 28 },
    { name: "Dec", Successful: 137, Cancelled: 59 },
  ];

  const dailyData = [
    { name: "Mon", Successful: 15, Cancelled: 2 },
    { name: "Tue", Successful: 12, Cancelled: 3 },
    { name: "Wed", Successful: 18, Cancelled: 1 },
    { name: "Thu", Successful: 10, Cancelled: 4 },
    { name: "Fri", Successful: 20, Cancelled: 5 },
    { name: "Sat", Successful: 8, Cancelled: 2 },
    { name: "Sun", Successful: 6, Cancelled: 1 },
  ];

  const monthlyTransactions = [
    {
      no: "M1001",
      date: "2025-08-01",
      customer: "GreenGrocer PH",
      item: "Commercial Display Chiller",
      qty: 1,
      total: 85000,
    },
    {
      no: "M1002",
      date: "2025-08-03",
      customer: "FreshMart Supermarket",
      item: "Double Glass Door Freezer",
      qty: 2,
      total: 220000,
    },
    {
      no: "M1003",
      date: "2025-08-04",
      customer: "OceanCatch Seafood",
      item: "Blast Freezer",
      qty: 1,
      total: 175000,
    },
    {
      no: "M1004",
      date: "2025-08-06",
      customer: "CoolBrew Café",
      item: "Undercounter Chiller",
      qty: 2,
      total: 96000,
    },
  ];

  const dailyTransactions = [
    {
      no: "D2001",
      customer: "ChillBox Convenience Store",
      item: "Single Door Upright Chiller",
      qty: 1,
      total: 45000,
    },
    {
      no: "D2002",
      customer: "Frosty Delights Ice Cream",
      item: "Chest Freezer",
      qty: 1,
      total: 38000,
    },
    {
      no: "D2003",
      customer: "Metro Deli",
      item: "Salad Display Chiller",
      qty: 1,
      total: 52000,
    },
  ];

  const topSellingItemsMonthly = [
    { name: "Commercial Display Chiller", sales: 48 },
    { name: "Double Glass Door Freezer", sales: 42 },
    { name: "Chest Freezer", sales: 38 },
    { name: "Blast Freezer", sales: 30 },
    { name: "Undercounter Chiller", sales: 27 },
  ];

  useEffect(() => {
    document.title = "Generate Report";
  }, []);

  const generatePDF = async () => {
    if (!reportRef.current) return;

    const element = reportRef.current;
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgProps = pdf.getImageProperties(imgData);
    const imgHeight = (imgProps.height * pageWidth) / imgProps.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${reportType}-overall-report.pdf`);
  };

  return (
    <AdminLayout title="Generate Report">
      {/* ADD DELIVERY BUTTON */}
      <div className="text-end mx-4 my-5 d-flex justify-content-end">
        <button
          className="add-delivery rounded-2 px-3 py-2 fs-6 d-flex align-items-center gap-2 btn btn-primary"
          onClick={() => navigate("/add-delivery")}
        >
          <FaPlus /> Add New Delivery
        </button>
      </div>

      <div ref={reportRef} className="bg-white p-4 rounded shadow-sm">
        {/* FILTER TOGGLE */}
        <div className="d-flex justify-content-center mb-4">
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

        {/* DELIVERY SUMMARY TABLE */}
        <div
          className="report p-4 rounded mb-5 "
          style={{ background: "#ffffff" }}
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
                <td>1,200</td>
                <td>120</td>
                <td>{reportType === "daily" ? "89" : "1,000+"}</td>
                <td>4.8 / 5.0 (1,320 reviews)</td>
                <td>80</td>
                <td>40</td>
              </tr>
            </tbody>
          </Table>
        </div>

        {/* TRANSACTIONS TABLE */}
        <div
          className="report p-4 rounded text-center"
          style={{ background: "#FFFFFF" }}
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
              {(reportType === "daily"
                ? dailyTransactions
                : monthlyTransactions
              ).map((t, index) => (
                <tr key={index}>
                  <td>{t.no}</td>
                  {reportType === "monthly" && <td>{t.date}</td>}
                  <td>{t.customer}</td>
                  <td>{t.item}</td>
                  <td>{t.qty}</td>
                  <td>{t.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        {/* ANALYTICS CHART */}
        <div
          className="p-4 rounded mb-5 mt-5 border"
          style={{ background: "#f6fbf6" }}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportType === "monthly" ? monthlyData : dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cfe8cf" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Successful" fill="#4CAF50" radius={[5, 5, 0, 0]} />
              <Bar dataKey="Cancelled" fill="#E57373" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* TOP SELLING ITEMS - Monthly */}
        {reportType === "monthly" && (
          <div
            className="p-4 rounded mb-5 mt-5 border"
            style={{ background: "#f6fbf6" }}
          >
            <h5 className="text-success mb-3 text-center h4">
              Top Selling Items (Monthly)
            </h5>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topSellingItemsMonthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cfe8cf" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sales" fill="#4CAF50" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="text-end mt-3">
        <button className="floating-pdf-btn" onClick={generatePDF}>
          <FaFilePdf /> Generate Full PDF Report
        </button>
      </div>
    </AdminLayout>
  );
};

export default MonitorDelivery;
