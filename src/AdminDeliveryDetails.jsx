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
            fetchDeliveries();
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

  const groupedDeliveries = deliveries.reduce((acc, item) => {
    const id = item.transaction_id;

    if (!acc[id]) {
      acc[id] = {
        transaction_id: id,
        customer_name: item.customer_name,
        total: item.total,
        delivery_status: item.delivery_status,
        items: [],
      };
    }

    acc[id].items.push({
      description: item.description,
      quantity: item.quantity,
    });

    return acc;
  }, {});

  return (
    <AdminLayout title="Delivery Details" onAddClick={handleAddDelivery}>
      <table className="delivery-table container-fluid table-responsive">
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
          {Object.values(groupedDeliveries)
            .sort((a, b) => b.transaction_id - a.transaction_id)
            .map((group, index) => (
              <tr key={index}>
                <td>{group.transaction_id}</td>
                <td>{group.customer_name}</td>
                <td>
                  {group.items.map((item, idx) => (
                    <div key={idx}>{item.description}</div>
                  ))}
                </td>
                <td>
                  {group.items.map((item, idx) => (
                    <div key={idx}>{item.quantity}</div>
                  ))}
                </td>
                <td>{group.total}</td>
                <td>{group.delivery_status}</td>
                <td>
                  <button
                    className="btn btn-view px-2 py-1 m-2 fw-normal border-light rounded-2"
                    onClick={() =>
                      navigate(`/view-delivery/${group.transaction_id}`)
                    }
                  >
                    View
                  </button>

                  <button
                    className="btn cancel-btn bg-danger px-2 py-1 m-2 fw-normal border-light rounded-2"
                    onClick={() => handleDelete(group.transaction_id)}
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
