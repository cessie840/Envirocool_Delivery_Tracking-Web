// pages/DeliveryDetails.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { useEffect } from "react";

const DeliveryDetails = () => {
  const navigate = useNavigate();

  const handleAddDelivery = () => navigate("/add-delivery");
  const handleViewDelivery = () => navigate("/view-delivery");
  
   useEffect(() => {
    document.title = "Admin Delivery Details";
  }, []);

  return (
    <AdminLayout title="Delivery Details" onAddClick={handleAddDelivery}>
      <table className="delivery-table container-fluid">
        <thead>
          <tr>
            <th>Transaction No.</th>
            <th>Customer Name</th>
            <th>Item Name</th>
            <th>Item/s Ordered</th>
            <th>Total Amount</th>
            <th>Delivery Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>000000001</td>
            <td>Daniel Padila</td>
            <td>Samsung S-Inverter Split Type Aircon</td>
            <td>4</td>
            <td>24000</td>
            <td>Ongoing</td>
            <td>
              <button
                className="btn btn-view px-2 py-1 m-2 fw-normal fs-6 border-light rounded-3"
                onClick={handleViewDelivery}
              >
                View
              </button>
              <button className="btn cancel-btn bg-danger px-2 py-1 m-2 fw-normal fs-6 border-light rounded-3">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </AdminLayout>
  );
};

export default DeliveryDetails;
