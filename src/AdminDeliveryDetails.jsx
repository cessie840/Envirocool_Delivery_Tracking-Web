import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table } from "react-bootstrap";
import AdminLayout from "./AdminLayout";
import UpdateOrderModal from "./UpdateOrderModal";

const DeliveryDetails = () => {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [filter, setFiltered] = useState([]);

  // 🔹 States for modal
  const [showModal, setShowModal] = useState(false);
  const [editableItems, setEditableItems] = useState([]);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_address: "",
    customer_contact: "",
    mode_of_payment: "",
    down_payment: "",
    balance: "",
    total: "",
  });
  const [transactionId, setTransactionId] = useState(null);

  const fetchDeliveries = () => {
    fetch("http://localhost/DeliveryTrackingSystem/get_deliveries.php")
      .then((res) => res.json())
      .then((data) => {
        setDeliveries(data);
        setFiltered(data);
      })
      .catch((err) => console.error("Failed to fetch deliveries:", err));
  };

  useEffect(() => {
    document.title = "Admin Delivery Details";
    fetchDeliveries();
  }, []);

  // 🔹 Handle Update (open modal with details)
  const handleUpdate = (id) => {
    setTransactionId(id);
    fetch(
      `http://localhost/DeliveryTrackingSystem/view_deliveries.php?transaction_id=${id}`
    )
      .then((res) => res.json())
      .then((data) => {
        setFormData({
          customer_name: data.customer_name,
          customer_address: data.customer_address,
          customer_contact: data.customer_contact,
          mode_of_payment: data.mode_of_payment,
          down_payment: data.down_payment,
          balance: data.balance,
          total: data.total,
        });
        setEditableItems(data.items);
        setShowModal(true);
      })
      .catch((err) => console.error("Failed to fetch order:", err));
  };

  const handleSubmit = () => {
    if (!/^09\d{9}$/.test(formData.customer_contact)) {
      alert("Contact number must start with '09' and be exactly 11 digits.");
      return;
    }

    fetch("http://localhost/DeliveryTrackingSystem/update_delivery.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transaction_id: transactionId,
        ...formData,
        items: editableItems,
      }),
    })
      .then((res) => res.json())
      .then((response) => {
        if (response.status === "success") {
          alert("Update successful!");
          fetchDeliveries();
          setShowModal(false);
        } else {
          alert("Update failed.");
        }
      })
      .catch((err) => {
        console.error("Update error:", err);
        alert("An error occurred.");
      });
  };

  const handleAddDelivery = () => navigate("/add-delivery");

  // Group from filtered list
  const groupedDeliveries = filter.reduce((acc, item) => {
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

  const handleSearch = (term) => {
    const lower = term.toLowerCase();
    setFiltered(
      deliveries.filter(
        (e) =>
          (e.transaction_id &&
            e.transaction_id.toString().toLowerCase().includes(lower)) ||
          (e.customer_name && e.customer_name.toLowerCase().includes(lower)) ||
          (e.description && e.description.toLowerCase().includes(lower))
      )
    );
  };

  return (
    <AdminLayout
      title="Delivery Details"
      onAddClick={handleAddDelivery}
      showSearch={true}
      onSearch={handleSearch}
    >
      <Table bordered hover responsive className="delivery-table container-fluid table-responsive bg-white">
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
              <tr key={index} className="delivery-table-hover">
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
                <td>
                  {Number(group.total).toLocaleString("en-PH", {
                    style: "currency",
                    currency: "PHP",
                  })}
                </td>
                <td>
                  <span
                    style={{
                      backgroundColor:
                        group.delivery_status === "Delivered"
                          ? "#C6FCD3"
                          : group.delivery_status === "Cancelled"
                            ? "#FDE0E0"
                            : group.delivery_status === "Pending"
                              ? "#FFF5D7"
                              : "transparent",
                      color:
                        group.delivery_status === "Delivered"
                          ? "#3E5F44"
                          : group.delivery_status === "Cancelled"
                            ? "red"
                            : group.delivery_status === "Pending"
                              ? "#FF9D23"
                              : "black",
                      padding: "5px",
                      borderRadius: "8px",
                      display: "inline-block",
                      minWidth: "80px",
                      textAlign: "center",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                    }}
                  >
                    {group.delivery_status}
                  </span>
                </td>
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
                    className="btn upd-btn btn-success px-2 py-1 m-2 fw-normal border-light rounded-2"
                    onClick={() => handleUpdate(group.transaction_id)}
                  >
                    Update
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* 🔹 Update Modal */}
      <UpdateOrderModal
        show={showModal}
        handleClose={() => setShowModal(false)}
        handleSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        editableItems={editableItems}
        setEditableItems={setEditableItems}
      />
    </AdminLayout>
  );
};

export default DeliveryDetails;
