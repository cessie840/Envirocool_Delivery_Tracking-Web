import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout"; 

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
      <div className="text-end mx-4 my-5">
        <button
          className="add-delivery rounded-2 px-5 py-2 fs-5"
          onClick={handleAddDelivery}
        >
          Add Delivery
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
