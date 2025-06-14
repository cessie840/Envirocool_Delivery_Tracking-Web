import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { FaPlus } from "react-icons/fa";

const AdminDashboard = () => {
  const navigate = useNavigate();

  // Set page title
  useEffect(() => {
    document.title = "Admin Dashboard";
  }, []);

  // Navigation handler
  const handleAddDelivery = () => navigate("/add-delivery");

  return (
    <AdminLayout title="Dashboard">
      {/* ADD DELIVERY BUTTON */}
      <div className="text-end mx-4 my-5 d-flex justify-content-end">
        <button
          className="add-delivery rounded-2 px-3 py-2 fs-6 d-flex align-items-center gap-2"
          onClick={() => navigate("/add-delivery")}
        >
          <FaPlus /> Add New Delivery
        </button>
      </div>
      {/* DASHBOARD CONTENT */}
      <div className="dashboard-content text-center mt-5 fs-4 border p-5">
        <p>Analytics Here</p>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
