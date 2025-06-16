import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";

const DeliveryDetails = () => {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);

  useEffect(() => {
    document.title = "Admin Delivery Details";

    fetch("http://localhost/DeliveryTrackingSystem/get_deliveries.php")
      .then((res) => res.json())
      .then((data) => setDeliveries(data))
      .catch((err) => console.error("Failed to fetch deliveries", err));
  }, []);
  

  const handleAddDelivery = () => navigate("/add-delivery");
  const handleViewDelivery = () => navigate("/view-delivery");

  return (
    <AdminLayout title="Delivery Details" onAddClick={handleAddDelivery}>
      <table className="delivery-table container-fluid">
        <thead>
          <tr>
            <th>Transaction No.</th>
            <th>Customer Name</th>
            <th>Item Description</th>
            <th>Item/s Quantity</th>
            <th>Total Amount</th>
            <th>Delivery Status</th>
            <th>Actions</th>
          </tr>
        </thead>
       <tbody>
  {deliveries.map((item, index) => (
    <tr key={index}>
      <td>{item.transaction_id}</td>
      <td>{item.customer_name}</td>
      <td>{item.description}</td>
      <td>{item.quantity}</td>
      <td>{item.total}</td>
      <td>{item.delivery_status}</td>
      <td>
        <button onClick={handleViewDelivery} className="btn btn-view">View</button>
        <button className="btn cancel-btn bg-danger">Delete</button>
      </td>
    </tr>
  ))}
</tbody>

      </table>
    </AdminLayout>
  );
};

export default DeliveryDetails;
