import React, { useState } from "react";
import { Button, Container, Card, Modal, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Sidebar from "./DriverSidebar";
import HeaderAndNav from "./DriverHeaderAndNav";

function OutForDelivery() {
  const [deliveries, setDeliveries] = useState(
    JSON.parse(localStorage.getItem("outForDelivery")) || []
  );
  const [delivered, setDelivered] = useState([]);
  const [cancelled, setCancelled] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const navigate = useNavigate();

  const markAsDelivered = (transactionNo) => {
    const delivery = deliveries.find((d) => d.transactionNo === transactionNo);
    const updated = deliveries.filter((d) => d.transactionNo !== transactionNo);
    setDeliveries(updated);
    setDelivered([...delivered, delivery]);
    localStorage.setItem("outForDelivery", JSON.stringify(updated));
    localStorage.setItem("delivered", JSON.stringify([...delivered, delivery]));
  };

  const handleCancelClick = (delivery) => {
    setSelectedDelivery(delivery);
    setShowCancelModal(true);
  };

  const confirmCancellation = () => {
    if (!cancelReason) return alert("Please select a cancellation reason.");
    const updated = deliveries.filter(
      (d) => d.transactionNo !== selectedDelivery.transactionNo
    );
    const cancelledWithReason = { ...selectedDelivery, reason: cancelReason };

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
  };

  return (
    <div style={{ backgroundColor: "#f0f4f7", minHeight: "100vh" }}>
      <HeaderAndNav onSidebarToggle={() => setShowSidebar(true)} />
      <Sidebar show={showSidebar} onHide={() => setShowSidebar(false)} />

      <Container className="py-4">
        <br />
        <h2 className="text-center text-success fw-bold mb-3">
          OUT FOR DELIVERY
        </h2>
        <br />
        {deliveries.length === 0 ? (
          <p className="text-muted text-center">No deliveries found.</p>
        ) : (
          deliveries.map((delivery, idx) => (
            <Card
              key={idx}
              className="mb-4 p-3 border border-info rounded"
              style={{ backgroundColor: "#eaf7f7" }}
            >
              <h5 className="text-center fw-bold text-dark mb-3">
                TRANSACTION NO. {delivery.transactionNo}
              </h5>
              <div className="border p-3 rounded bg-white">
                <div className="d-flex justify-content-between mb-1">
                  <strong>Customer Name:</strong>
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
                <div className="d-flex justify-content-between mb-1">
                  <strong>Items:</strong>
                  <div>
                    {delivery.items.map((item, i) => (
                      <div key={i}>
                        {item.name} <strong>x{item.qty}</strong>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <strong>Unit Cost:</strong>
                  <span>{delivery.unitCost}</span>
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <strong>Total Cost:</strong>
                  <span>{delivery.totalCost}</span>
                </div>
              </div>
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

      {/* FAILED?CANCELLED REPORT MODAL */}
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
                <option value="Customer cancelled">Customer cancelled</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
            Close
          </Button>
          <Button variant="danger" onClick={confirmCancellation}>
            Confirm Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default OutForDelivery;
