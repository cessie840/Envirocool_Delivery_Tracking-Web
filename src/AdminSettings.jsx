import React from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { useEffect } from "react";

const Settings = () => {
  const navigate = useNavigate();
  const handleAddDelivery = () => navigate("/add-delivery");

    useEffect(() => {
      document.title = "Admin Settings";
    }, []);

  return (
    <AdminLayout title="Monitor Delivery">
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
        <p>Admin Settings</p>
      </div>
    </AdminLayout>
  );
};

export default Settings;
