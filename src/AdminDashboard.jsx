import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { FaPlus } from "react-icons/fa";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    document.title = "Admin Dashboard";

    // Generate mock data for each month
    const data = Array.from({ length: 12 }, () => {
      const success = Math.floor(Math.random() * 100 + 50);
      const cancelled = Math.floor(Math.random() * 60 + 20);
      return { success, cancelled };
    });

    setMonthlyData(data);
  }, []);

  const totalSuccess = monthlyData.reduce((sum, m) => sum + m.success, 0);
  const totalCancelled = monthlyData.reduce((sum, m) => sum + m.cancelled, 0);

  return (
    <AdminLayout title="Dashboard">
      {/* ADD DELIVERY BUTTON */}
      <div className="text-end mx-4 my-3 d-flex justify-content-end">
        <button
          className="add-delivery rounded-2 px-3 py-2 fs-6 d-flex align-items-center gap-2"
          onClick={() => navigate("/add-delivery")}
        >
          <FaPlus /> Add New Delivery
        </button>
      </div>

      {/* DASHBOARD CONTENT */}
      <div className="dashboard-content mt-4 fs-4 p-2 p-md-4 bg-white">
        <div className="container-fluid">
          {/* Cards Row */}
          <div className="row g-4">
            {/* Successful Deliveries */}
            <div className="col-lg-3 col-md-6 col-sm-12">
              <div className="card shadow-sm h-100">
                <div className="card-body text-center">
                  <i className="bi bi-check-circle-fill text-success fs-3 mb-2"></i>
                  <h6 className="text-muted">Successful Deliveries</h6>
                  <p className="fw-bold fs-5 mb-0">1,200</p>
                </div>
              </div>
            </div>

            {/* Failed Deliveries */}
            <div className="col-lg-3 col-md-6 col-sm-12">
              <div className="card shadow-sm h-100">
                <div className="card-body text-center">
                  <i className="bi bi-x-circle-fill text-danger fs-3 mb-2"></i>
                  <h6 className="text-muted">Failed Deliveries</h6>
                  <p className="fw-bold fs-5 mb-0">120</p>
                </div>
              </div>
            </div>

            {/* Daily Deliveries */}
            <div className="col-lg-3 col-md-6 col-sm-12">
              <div className="card shadow-sm h-100">
                <div className="card-body text-center">
                  <i className="bi bi-truck text-warning fs-3 mb-2"></i>
                  <h6 className="text-muted">Daily Deliveries</h6>
                  <p className="fw-bold fs-5 mb-0">89</p>
                </div>
              </div>
            </div>

            {/* Customer Satisfaction */}
            <div className="col-lg-3 col-md-6 col-sm-12">
              <div className="card shadow-sm h-100">
                <div className="card-body text-center">
                  <i className="bi bi-star-fill text-warning fs-3 mb-2"></i>
                  <h6 className="text-muted">Customer Satisfaction</h6>
                  <p className="fw-bold fs-5 mb-1">4.8 / 5.0</p>
                  <small className="text-muted">1,320 reviews</small>
                </div>
              </div>
            </div>
          </div>

          {/* Classification Card */}
          <div className="row g-4 mt-4">
            <div className="col-12">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h5 className="card-title text-center mb-4">
                    Failed Delivery Classification
                  </h5>
                  <div className="d-flex flex-column flex-md-row justify-content-around text-center fs-6">
                    {/* Customer Didn’t Receive */}
                    <div className="p-3">
                      <i className="bi bi-person-x-fill text-danger fs-3 mb-2"></i>
                      <h6 className="text-danger">Customer Didn’t Receive</h6>
                      <p className="fw-bold fs-5">80</p>
                    </div>

                    {/* Damaged Item */}
                    <div className="p-3">
                      <i className="bi bi-box-seam text-warning fs-3 mb-2"></i>
                      <h6 className="text-danger">Damaged Item</h6>
                      <p className="fw-bold fs-5">40</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bar Chart Card */}
          <div className="row g-4 mt-4">
            <div className="col-12">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h5 className="card-title text-center mb-4">
                    Monthly Delivery Overview
                  </h5>

                  <div className="overflow-auto">
                    <div
                      className="d-flex justify-content-between align-items-end"
                      style={{ minWidth: "700px", height: "260px" }}
                    >
                      {monthlyData.map((data, i) => {
                        const month = [
                          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
                        ][i];

                        const maxHeight = 150;
                        const maxValue = 160;
                        const successHeight = (data.success / maxValue) * maxHeight;
                        const cancelledHeight = (data.cancelled / maxValue) * maxHeight;

                        return (
                          <div
                            key={i}
                            className="d-flex flex-column align-items-center"
                            style={{ flex: "1", minWidth: "50px" }}
                          >
                            <small className="text-success fw-bold" style={{ fontSize: "0.75rem" }}>
                              {data.success}
                            </small>
                            <small className="text-danger fw-bold" style={{ fontSize: "0.75rem" }}>
                              {data.cancelled}
                            </small>

                            {/* Bars */}
                            <div
                              className="d-flex gap-1 align-items-end"
                              style={{ height: `${maxHeight}px` }}
                            >
                              <div
                                title={`${data.success} Successful`}
                                style={{
                                  height: `${successHeight}px`,
                                  width: "14px",
                                  backgroundColor: "green",
                                  borderRadius: "3px",
                                }}
                              ></div>
                              <div
                                title={`${data.cancelled} Cancelled`}
                                style={{
                                  height: `${cancelledHeight}px`,
                                  width: "14px",
                                  backgroundColor: "red",
                                  borderRadius: "3px",
                                }}
                              ></div>
                            </div>

                            <small className="mt-2 text-muted">{month}</small>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="d-flex justify-content-center gap-4 mt-4">
                    <div className="d-flex align-items-center gap-2">
                      <div style={{ width: "15px", height: "15px", backgroundColor: "green" }}></div>
                      <small>Successful</small>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div style={{ width: "15px", height: "15px", backgroundColor: "red" }}></div>
                      <small>Cancelled</small>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="d-flex justify-content-center mt-3 gap-5">
                    <h6 className="text-success">Total Successful: {totalSuccess}</h6>
                    <h6 className="text-danger">Total Cancelled: {totalCancelled}</h6>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
