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

ChartJS.register(ArcElement, Tooltip, Legend);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    document.title = "Admin Dashboard";

    const data = Array.from({ length: 12 }, () => {
      const success = Math.floor(Math.random() * 100 + 50);
      const cancelled = Math.floor(Math.random() * 60 + 20);
      return { success, cancelled };
    });

    setMonthlyData(data);
  }, []);

  const handleAddDelivery = () => navigate("/add-delivery");

  return (
    <AdminLayout
      title="Dashboard"
      showSearch={false}
      onAddClick={handleAddDelivery}
    >
      <div className="container">
        {/* Top 4 Cards */}
        <div className="row mb-4">
          {/* Total Transactions */}
          <div className="col-md-3 mb-3">
            <div className="dashboard-card bg-light p-3 h-100">
              <div className="card-left icon-transactions">
                <FaListAlt />
              </div>
              <div className="card-right">
                <h5>10</h5>
                <small>Total Transactions</small>
              </div>
            </div>
          </div>

          {/* Successful */}
          <div className="col-md-3 mb-3">
            <div className="dashboard-card bg-light p-3 h-100">
              <div className="card-left icon-success">
                <FaCheckCircle />
              </div>
              <div className="card-right">
                <h5>120</h5>
                <small>Successful</small>
              </div>
            </div>
          </div>

          {/* Cancelled */}
          <div className="col-md-3 mb-3">
            <div className="dashboard-card bg-light p-3 h-100">
              <div className="card-left icon-cancel">
                <FaTimesCircle />
              </div>
              <div className="card-right">
                <h5>30</h5>
                <small>Cancelled</small>
              </div>
            </div>
          </div>

          {/* Outgoing */}
          <div className="col-md-3 mb-3">
            <div className="dashboard-card bg-light p-3 h-100">
              <div className="card-left icon-pending">
                <FaClock />
              </div>
              <div className="card-right">
                <h5>45</h5>
                <small>Outgoing</small>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom 2 Panels */}
        <div className="row">
          {/* Recent Transactions */}
          <div className="col-md-8 mb-3">
            <div className="dashboard-panel bg-white p-4 h-100 shadow-sm">
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="recent-transaction-title m-0">
                  Recent Transactions
                </h5>
                <div className="d-flex gap-3">
                  <FaEquals className="text-secondary cursor-pointer" />
                  <FaSearch className="text-secondary cursor-pointer" />
                </div>
              </div>

              {/* Responsive Table */}
              <div className="table-responsive">
                <table className="table align-middle custom-table mb-0">
                  <thead>
                    <tr>
                      <th scope="col">Transaction No.</th>
                      <th scope="col">Client</th>
                      <th scope="col">Date Ordered</th>
                      <th scope="col">Item Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>#1001</td>
                      <td>John Doe</td>
                      <td>Aug 25, 2025</td>
                      <td>
                        <span className="badge bg-success">Successful</span>
                      </td>
                    </tr>
                    <tr>
                      <td>#1002</td>
                      <td>Jane Smith</td>
                      <td>Aug 24, 2025</td>
                      <td>
                        <span className="badge bg-danger">Cancelled</span>
                      </td>
                    </tr>
                    <tr>
                      <td>#1003</td>
                      <td>Michael Johnson</td>
                      <td>Aug 23, 2025</td>
                      <td>
                        <span className="badge bg-warning text-dark">
                          Out to Delivery
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Footer Note */}
              <div className="text-first text-muted small mt-2">
                Showing 5 recent transactions out of 100
              </div>
            </div>
          </div>

          {/* Pending Transactions */}
          <div className="col-md-4 mb-3">
            <div className="dashboard-panel bg-white p-4 h-100 shadow-sm">
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="customer-satisfaction-title m-0">
                  Pending Transactions
                </h5>
                <div className="d-flex gap-3">
                  <FaEquals className="text-secondary cursor-pointer" />
                  <FaSearch className="text-secondary cursor-pointer" />
                </div>
              </div>

              {/* Responsive Table */}
              <div className="table-responsive">
                <table className="table align-middle custom-table mb-0">
                  <thead>
                    <tr>
                      <th scope="col">Transaction No.</th>
                      <th scope="col">Client</th>
                      <th scope="col">Date Ordered</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>#2001</td>
                      <td>Chris Evans</td>
                      <td>Aug 22, 2025</td>
                    </tr>
                    <tr>
                      <td>#2002</td>
                      <td>Emma Watson</td>
                      <td>Aug 21, 2025</td>
                    </tr>
                    <tr>
                      <td>#2003</td>
                      <td>Robert Downey</td>
                      <td>Aug 20, 2025</td>
                    </tr>
                    <tr>
                      <td>#2004</td>
                      <td>Scarlett Johansson</td>
                      <td>Aug 19, 2025</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Footer Note */}
              <div className="text-first text-muted small mt-2">
                Showing 4 pending transactions
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
