import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import AdminLayout from "./AdminLayout";
import UpdateOrderModal from "./UpdateOrderModal";

const ViewOrder = () => {
  const navigate = useNavigate();
  const { transaction_id } = useParams();

  const [orderDetails, setOrderDetails] = useState(null);
  const [editableItems, setEditableItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    tracking_number: "",
    customer_name: "",
    customer_address: "",
    customer_contact: "",
    date_of_order: "",
    target_date_delivery: "",
    mode_of_payment: "",
    payment_option: "",
    down_payment: "",
    balance: "",
    total: "",
  });

  useEffect(() => {
    document.title = "View Order Details";
    fetch(
      `http://localhost/DeliveryTrackingSystem/view_deliveries.php?transaction_id=${transaction_id}`
    )
      .then((res) => res.json())
      .then((data) => {
        setOrderDetails(data);
        setFormData({
          tracking_number: data.tracking_number,
          customer_name: data.customer_name,
          customer_address: data.customer_address,
          customer_contact: data.customer_contact,
          date_of_order: data.date_of_order,
          mode_of_payment: data.mode_of_payment,
          payment_option: data.payment_option,
          down_payment: data.down_payment,
          balance: data.balance,
          total: data.total,
        });
      })

      .catch((err) => {
        console.error("Failed to fetch order:", err);
      });
  }, [transaction_id]);

  const handleUpdate = () => {
    setEditableItems(JSON.parse(JSON.stringify(orderDetails.items)));
    setShowModal(true);
  };

  const handleClose = () => setShowModal(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const hasInvalidQuantity = editableItems.some((item) => item.quantity < 1);
    if (hasInvalidQuantity) {
      alert("One or more items have invalid quantity.");
      return;
    }

    if (!/^09\d{9}$/.test(formData.customer_contact)) {
      alert("Contact number must start with '09' and be exactly 11 digits.");
      return;
    }

    fetch("http://localhost/DeliveryTrackingSystem/update_delivery.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transaction_id,
        ...formData,
        items: editableItems,
      }),
    })
      .then((res) => res.json())
      .then((response) => {
        if (response.status === "success") {
          alert("Update successful!");
          setOrderDetails((prev) => ({
            ...prev,
            ...formData,
            items: editableItems,
          }));
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

  if (!orderDetails) return <p className="text-center mt-5">Loading...</p>;

  const totalCost = orderDetails.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_cost,
    0
  );

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
            navigate(-1);
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

  return (
    <AdminLayout title="View Order Details" showSearch={false}>
      <div className="d-flex justify-content-start mt-4 ms-4">
        <button
          className="btn back-btn d-flex align-items-center gap-2"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft /> Back
        </button>
      </div>

      <div className="container mt-4 w-75">
        <div className="card shadow-lg border-0 rounded-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mt-3">
              <h2 className="card-title fw-bold text-success">
                Transaction No. {transaction_id}
              </h2>
              <h2 className="card-title fw-bold text-success">
                Tracking No. {orderDetails.tracking_number}
              </h2>
            </div>

            <hr />

            <div className="mb-3 p-3 bg-light border rounded-3 shadow-sm">
              <h5 className="text-success">Customer Details</h5>
              <p>
                <strong>Name:</strong> {orderDetails.customer_name}
              </p>
              <p>
                <strong>Address:</strong> {orderDetails.customer_address}
              </p>
              <p>
                <strong>Contact:</strong> {orderDetails.customer_contact}
              </p>
              <p>
                <strong>Date of Order:</strong> {orderDetails.date_of_order}
              </p>
              <p>
                <strong>Target Delivery Date:</strong>{" "}
                {orderDetails.target_date_delivery}
              </p>
              <p>
                <strong>Payment Mode:</strong> {orderDetails.mode_of_payment}
              </p>
              <p>
                <strong>Payment Option:</strong> {orderDetails.payment_option}
              </p>
              <p>
                <strong>Total:</strong> ₱
                {Number(orderDetails?.total || 0).toLocaleString()}
              </p>
              <p>
                <strong>Down Payment:</strong> ₱
                {Number(orderDetails?.down_payment || 0).toLocaleString()}
              </p>
              <p>
                <strong>Balance:</strong> ₱
                {Number(orderDetails?.balance || 0).toLocaleString()}
              </p>
            </div>

            <div className="mb-3 p-3 bg-light border rounded-3 shadow-sm">
              <h5 className="text-success">Items Ordered</h5>
              <ul className="list-group list-group-flush">
                {orderDetails.items.map((item, index) => (
                  <li
                    key={index}
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <div>
                      {item.description} x{item.quantity} <br />
                      <small className="text-muted">
                        Unit Cost: ₱{Number(item.unit_cost).toLocaleString()}
                      </small>
                    </div>
                    <strong>
                      ₱{(item.unit_cost * item.quantity).toLocaleString()}
                    </strong>
                  </li>
                ))}
              </ul>
              <div className="d-flex justify-content-between align-items-center mt-4 px-3">
                <h4 className="fw-bold text-danger">
                  Balance: ₱
                  {Number(orderDetails?.balance || 0).toLocaleString()}
                </h4>
                <h4 className="fw-bold text-success">
                  Total Cost: ₱{totalCost.toLocaleString()}
                </h4>
              </div>
            </div>

            <div className="buttons d-flex justify-content-center gap-5 mt-5">
              <button
                className="btn upd-btn btn-success px-5 py-2 rounded-3"
                onClick={handleUpdate}
              >
                Update
              </button>
              <button
                className="btn del-btn btn-danger px-5 py-2 rounded-3"
                onClick={() => handleDelete(transaction_id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <UpdateOrderModal
        show={showModal}
        handleClose={handleClose}
        handleSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        editableItems={editableItems}
        setEditableItems={setEditableItems}
      />
    </AdminLayout>
  );
};

export default ViewOrder;
