import React, { useState, useEffect } from "react";
import { Button, Container, Card, Modal, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Sidebar from "./DriverSidebar";
import HeaderAndNav from "./DriverHeaderAndNav";
import axios from "axios";

function OutForDelivery() {
  const [deliveries, setDeliveries] = useState([]);
  const [delivered, setDelivered] = useState([]);
  const [cancelled, setCancelled] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const navigate = useNavigate();

  // ✅ Currency formatter
  const formatCurrency = (amount) =>
    `₱${Number(amount).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.pers_username) return;

    axios
      .post(
        "http://localhost/DeliveryTrackingSystem/fetch_out_for_delivery.php",
        {
          pers_username: user.pers_username,
        }
      )
      .then((res) => {
        if (res.data.success === false) {
          alert(res.data.message);
        } else if (Array.isArray(res.data)) {
          setDeliveries(res.data);
        } else if (Array.isArray(res.data.data)) {
          setDeliveries(res.data.data);
        }
      })
      .catch((err) => {
        console.error("Error fetching deliveries:", err);
        alert("Failed to fetch deliveries. Please try again later.");
      });
  }, []);

  const markAsDelivered = (transactionNo) => {
    const delivery = deliveries.find((d) => d.transactionNo === transactionNo);
    if (!delivery) {
      alert("Delivery not found.");
      return;
    }

    axios
      .post(
        "http://localhost/DeliveryTrackingSystem/update_delivered_status.php",
        {
          transaction_id: transactionNo,
          status: "Delivered", // ✅ FIX: send status
        }
      )
      .then((res) => {
        const { success, message } = res.data;
        if (success) {
          const updatedDeliveries = deliveries.filter(
            (d) => d.transactionNo !== transactionNo
          );
          setDeliveries(updatedDeliveries);
          setDelivered([...delivered, delivery]);

          alert("Delivery successfully marked as 'Delivered'.");
          navigate("/successful-delivery");
        } else {
          alert(`Error: ${message}`);
        }
      })
      .catch((err) => {
        console.error("API error:", err);
        alert("Failed to update delivery status. Please try again later.");
      });
  };


  const handleCancelClick = (delivery) => {
    setSelectedDelivery(delivery);
    setShowCancelModal(true);
  };

  const confirmCancellation = () => {
    if (!cancelReason) {
      alert("Please select a cancellation reason.");
      return;
    }

    axios
      .post("http://localhost/DeliveryTrackingSystem/cancelled_delivery.php", {
        transaction_id: selectedDelivery.transactionNo,
        reason: cancelReason,
      })
      .then((res) => {
        const { success, message } = res.data;
        if (success) {
          const updated = deliveries.filter(
            (d) => d.transactionNo !== selectedDelivery.transactionNo
          );
          const cancelledWithReason = {
            ...selectedDelivery,
            reason: cancelReason,
          };

          setDeliveries(updated);
          setCancelled([...cancelled, cancelledWithReason]);

          localStorage.setItem("outForDelivery", JSON.stringify(updated));
          localStorage.setItem(
            "cancelled",
            JSON.stringify([...cancelled, cancelledWithReason])
          );

          setShowCancelModal(false);
          setSelectedDelivery(null);
          setCancelReason("");

          alert("Delivery marked as 'Cancelled'.");
          navigate("/failed-delivery");
        } else {
          alert(`Failed to cancel delivery: ${message}`);
        }
      })
      .catch((err) => {
        console.error("Cancel error:", err);
        alert("Error cancelling delivery.");
      });
  };

  return (
    <div style={{ backgroundColor: "#f0f4f7", minHeight: "100vh" }}>
      <HeaderAndNav onSidebarToggle={() => setShowSidebar(true)} />
      <Sidebar show={showSidebar} onHide={() => setShowSidebar(false)} />

      <Container className="py-4">
        <h2 className="text-center text-success fw-bold mb-3">
          OUT FOR DELIVERY
        </h2>

        {deliveries.length === 0 ? (
          <p className="text-muted text-center">No deliveries found.</p>
        ) : (
          deliveries.map((delivery, idx) => (
            <Card
              key={idx}
              className="mb-4 p-3 border border-info rounded"
              style={{ backgroundColor: "#eaf7f7" }}
            >
              {/* Header */}
              <h5 className="text-center fw-bold text-dark mb-3">
                TRANSACTION NO. {delivery.transactionNo}
              </h5>

              <div className="border p-3 rounded bg-white">
                {/* Customer Info */}
                <div className="d-flex justify-content-between mb-1">
                  <strong>Customer:</strong>
                  <span>{delivery.customerName}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <strong>Address:</strong>
                  <span>{delivery.address}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <strong>Contact:</strong>
                  <span>{delivery.contact}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <strong>Payment:</strong>
                  <span>{delivery.paymentMode}</span>
                </div>

                <strong className="d-block mb-1">Items:</strong>
                {delivery.items.map((item, i) => (
                  <div
                    key={i}
                    className="d-flex justify-content-between mb-1 ps-3"
                  >
                    <span>
                      {item.name}{" "}
                      <span style={{ fontWeight: "bold", color: "#198754" }}>
                        x{item.qty}
                      </span>
                    </span>
                    <span style={{ display: "flex", gap: "10px" }}>
                      <span>{formatCurrency(item.unitCost)}</span> |{" "}
                      <span>{formatCurrency(item.qty * item.unitCost)}</span>
                    </span>
                  </div>
                ))}

                {/* Dashed Separator */}
                <hr
                  className="my-2"
                  style={{
                    borderTop: "2px dashed #999",
                  }}
                />

                {/* Total */}
                <div className="d-flex justify-content-between mb-3">
                  <strong>Total:</strong>
                  <span className="fw-bold">
                    {formatCurrency(delivery.totalCost)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-flex justify-content-center gap-2 mt-3">
                <Button
                  size="sm"
                  style={{
                    backgroundColor: "#198754",
                    borderColor: "#198754",
                    borderRadius: "10px",
                  }}
                  onClick={() => markAsDelivered(delivery.transactionNo)}
                >
                  Delivered
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  style={{ borderRadius: "10px" }}
                  onClick={() => handleCancelClick(delivery)}
                >
                  Cancelled/Failed
                </Button>
              </div>
            </Card>
          ))
        )}
      </Container>

      {/* FAILED/CANCELLED MODAL */}
      <Modal
        show={showCancelModal}
        onHide={() => setShowCancelModal(false)}
        centered
      >
        <Modal.Header closeButton style={{ backgroundColor: "#E8F8F5" }}>
          <Modal.Title>Select Cancellation Reason</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Reason</Form.Label>
              <Form.Select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              >
                <option value="">-- Select Reason --</option>
                <option value="Customer didn't receive">
                  Customer didn't receive
                </option>
                <option value="Damaged item">Damaged item</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
            Close
          </Button>
          <Button variant="danger" onClick={confirmCancellation}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default OutForDelivery;
