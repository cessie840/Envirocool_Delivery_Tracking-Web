import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";

const DeliveryDetails = () => {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);

  const fetchDeliveries = () => {
    fetch("http://localhost/DeliveryTrackingSystem/get_deliveries.php")
      .then((res) => res.json())
      .then((data) => {
        setDeliveries(data);
      })
      .catch((err) => console.error("Failed to fetch deliveries:", err));
  };

  useEffect(() => {
    document.title = "Admin Delivery Details";
    fetchDeliveries();
  }, []);

  const handleDelete = (transaction_id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      fetch("http://localhost/DeliveryTrackingSystem/delete_deliveries.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction_id }),
      })
        .then((res) => res.json())
        .then((response) => {
          if (response.status === "success") {
            alert("Transaction deleted successfully");
            fetchDeliveries(); //
          } else {
            alert("Failed to delete");
          }
        })
        .catch((err) => {
          console.error("Delete error:", err);
          alert("An error occurred");
        });
    }
  };

  const handleAddDelivery = () => navigate("/add-delivery");
  const handleViewDelivery = (transaction_id) => {
    navigate(`/view-delivery/${transaction_id}`);
  };

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
                <button
                  className="btn btn-view px-2 py-1 m-2 fw-normal fs-6 border-light rounded-3"
                  onClick={() =>
                    navigate(`/view-delivery/${item.transaction_id}`)
                  }
                >
                  View
                </button>

                <button
                  className="btn cancel-btn bg-danger px-2 py-1 m-2 fw-normal fs-6 border-light rounded-3"
                  onClick={() => handleDelete(item.transaction_id)} // FIXED: Correct variable
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminLayout>
  );
};

export default DeliveryDetails;
