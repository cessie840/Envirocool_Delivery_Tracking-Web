import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import AdminLayout from "./AdminLayout";
import UpdateOrderModal from "./UpdateOrderModal";
import RescheduleModal from "./RescheduleModal";
import { Button, Modal, Form } from "react-bootstrap";

const ViewOrder = () => {
  const navigate = useNavigate();
  const { transaction_id } = useParams();
  const [orderDetails, setOrderDetails] = useState(null);
  const [editableItems, setEditableItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
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
    proof_of_delivery: "",
  });

  const [showProofViewModal, setShowProofViewModal] = useState(false);
  const [proofUrl, setProofUrl] = useState("");

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  useEffect(() => {
    document.title = "View Order Details";
    fetch(
      `https://13.239.143.31/DeliveryTrackingSystem/view_deliveries.php?transaction_id=${transaction_id}`
    )
      .then((res) => res.json())
      .then((data) => {
        setOrderDetails(data);
        setFormData({
          tracking_number: data.tracking_number,
          customer_name: data.customer_name,
          customer_address: data.customer_address,
          customer_contact: data.customer_contact,
          date_of_order: formatDate(data.date_of_order),
          mode_of_payment: data.mode_of_payment,
          payment_option: data.payment_option,
          down_payment: data.down_payment,
          balance: data.balance,
          total: data.total,
          target_date_delivery: formatDate(data.target_date_delivery),
          proof_of_delivery: data.proof_of_delivery,
        });
      })
      .catch((err) => {
        console.error("Failed to fetch order:", err);
      });
  }, [transaction_id]);

  const handleUpdate = () => {
    const fixedItems = orderDetails.items.map((item) => ({
      quantity: item.quantity,
      type_of_product: item.type_of_product || item.product_type || "",
      description: item.description || item.item_name || "",
      unit_cost: item.unit_cost,
    }));
    setEditableItems(fixedItems);
    setShowModal(true);
  };

  const handleRescheduleUpdate = (newDate) => {
    setOrderDetails((prev) => ({
      ...prev,
      target_date_delivery: formatDate(newDate),
      status: "Pending",
      cancelled_reason: null,
    }));
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

    const formatDateForDB = (dateString) => {
      if (!dateString || dateString === "-") return null;
      const [mm, dd, yyyy] = dateString.split("/");
      return `${yyyy}-${mm}-${dd}`;
    };

    const payload = {
      transaction_id,
      ...formData,
      date_of_order: formatDateForDB(formData.date_of_order),
      target_date_delivery: formatDateForDB(formData.target_date_delivery),
      items: editableItems,
    };

    fetch("https://13.239.143.31/DeliveryTrackingSystem/update_delivery.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
          console.error("Update failed:", response.message);
          alert("Update failed: " + (response.message || "Unknown error"));
        }
      })
      .catch((err) => {
        console.error("Update error:", err);
        alert("An error occurred.");
      });
  };

  if (!orderDetails) return <p className="text-center mt-5">Loading...</p>;

  const totalCost = (orderDetails?.items || []).reduce(
    (sum, item) => sum + item.quantity * item.unit_cost,
    0
  );

  const renderStatusBadge = (status) => {
    switch (status) {
      case "Delivered":
        return <strong style={{ color: "#327229" }}>{status}</strong>;
      case "Cancelled":
        return <strong style={{ color: "#DC3545" }}>{status}</strong>;
      case "Out for Delivery":
        return <strong style={{ color: "#2193C0FF" }}>{status}</strong>;
      case "Pending":
        return <strong style={{ color: "#ECAE62FF" }}>{status}</strong>;
      default:
        return <strong>{status}</strong>;
    }
  };

  return (
    <AdminLayout title="View Order Details" showSearch={false}>
      <div className="d-flex justify-content-start mt-4 ms-4">
        <button
          className="back-btn btn-success d-flex align-items-center gap-2"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft /> Back
        </button>
      </div>

      <div className="container mt-4 w-75">
        <div className="view-order card shadow-lg border-0 rounded-4">
          <div className="view-order card-body">
            <div className="d-flex justify-content-between align-items-center mt-3 mb-3">
              <h4 className="card-title fw-bold text-success">
                Transaction No. {transaction_id}
              </h4>
              <h4 className="card-title fw-bold text-success">
                Tracking No. {orderDetails.tracking_number}
              </h4>
            </div>

            <div className="m-2 p-3 bg-white border rounded-3 shadow-sm">
              <div className="row">
                <div className="col-md-6">
                  <h5 className="text-success fw-bold">Client Details</h5>
                  <p>
                    <span>Name:</span> {orderDetails.customer_name}
                  </p>
                  <p>
                    <span>Address:</span> {orderDetails.customer_address}
                  </p>
                  <p>
                    <span>Contact:</span> {orderDetails.customer_contact}
                  </p>
                  <p>
                    <span>Date of Order:</span>
                    {formatDate(orderDetails.date_of_order)}
                  </p>
                  <p>
                    <span>Target Delivery Date: </span>
                    {formatDate(orderDetails.target_date_delivery)}
                  </p>
                  <p>
                    <span>Rescheduled Delivery Date: </span>
                    {orderDetails.rescheduled_date
                      ? formatDate(orderDetails.rescheduled_date)
                      : "—"}
                  </p>
                  <br />
                  <div>
                    <h5 className="text-success fw-bold">Delivery Status</h5>
                  </div>
                  <p>
                    <span>Current Delivery Status: </span>
                    {renderStatusBadge(orderDetails.status)}
                  </p>

                  {orderDetails.status === "Cancelled" &&
                    orderDetails.cancelled_reason && (
                      <p>
                        <span>Cancellation Reason: </span>
                        <strong className="text-danger">
                          {orderDetails.cancelled_reason}
                        </strong>
                      </p>
                    )}

                  {/* Proof of Delivery Button */}
                  {orderDetails.status === "Delivered" &&
                    orderDetails.proof_of_delivery && (
                      <div className="mt-3">
                        <button
                          className="btn btn-success"
                          onClick={() => {
                            setProofUrl(
                              `https://13.239.143.31/DeliveryTrackingSystem/${orderDetails.proof_of_delivery}`
                            );
                            setShowProofViewModal(true);
                          }}
                        >
                          View Proof of Delivery
                        </button>
                      </div>
                    )}
                </div>

                <div className="col-md-6">
                  <h5 className="text-success fw-bold">Payment Details</h5>
                  <p>
                    <span>Payment Method:</span> {orderDetails.mode_of_payment}
                  </p>
                  <p>
                    <span>Payment Option:</span> {orderDetails.payment_option}
                  </p>
                  <p>
                    <span>Total:</span> ₱
                    {Number(orderDetails?.total || 0).toLocaleString()}
                  </p>
                  <p>
                    <span>Down Payment:</span> ₱
                    {Number(orderDetails?.down_payment || 0).toLocaleString()}
                  </p>
                  <p>
                    <span>Balance:</span> ₱
                    {Number(orderDetails?.balance || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="mx-2 my-3 p-3 bg-white border rounded-3 shadow-sm">
              <h5 className="text-success fw-bold">Items Ordered</h5>
              <ul className="list-group list-group-flush fw-semibold">
                {(orderDetails.items || []).map((item, index) => (
                  <li
                    key={index}
                    className="list-group-item d-flex justify-content-between align-items-center fw-semibold"
                  >
                    <div>
                      {item.type_of_product} {item.description} x{item.quantity}
                      <br />
                      <small className="text-muted fw-bold">
                        Unit Cost: ₱{Number(item.unit_cost).toLocaleString()}
                      </small>
                    </div>
                    <span className="fw-bold">
                      ₱{(item.unit_cost * item.quantity).toLocaleString()}
                    </span>
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

            <div className="buttons d-flex justify-content-center gap-5 mt-4">
              <button
                className="btn upd-btn btn-success px-5 py-2 rounded-2"
                onClick={handleUpdate}
              >
                Update
              </button>

              {orderDetails.status === "Cancelled" && (
                <button
                  className="btn btn-view px-5 py-2 rounded-3 fs-5"
                  onClick={() => setShowReschedule(true)}
                >
                  Reschedule
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Update Modal */}
      <UpdateOrderModal
        show={showModal}
        handleClose={handleClose}
        handleSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        editableItems={editableItems}
        setEditableItems={setEditableItems}
      />

      {/* Reschedule Modal */}
      <RescheduleModal
        show={showReschedule}
        handleClose={() => setShowReschedule(false)}
        transaction_id={transaction_id}
        onReschedule={(updatedFields) => {
          setOrderDetails((prev) => ({ ...prev, ...updatedFields }));
        }}
      />

      <Modal
        show={showProofViewModal}
        onHide={() => setShowProofViewModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Proof of Delivery</Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex justify-content-center">
          {proofUrl ? (
            <img
              src={proofUrl}
              alt="Proof of Delivery"
              className="w-100 h-auto"
              style={{
                maxHeight: "85vh",
                objectFit: "contain",
                borderRadius: "10px",
                boxShadow: "0 6px 15px rgba(0,0,0,0.3)",
              }}
            />
          ) : (
            <p className="text-muted">No proof of delivery available.</p>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowProofViewModal(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </AdminLayout>
  );
};

export default ViewOrder;
