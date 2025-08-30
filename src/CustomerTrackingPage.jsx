import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, Button, Form } from "react-bootstrap";
import logo from "./assets/envirocool-logo.png";

const CustomerTrackingPage = () => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (trackingNumber.trim() === "") {
      alert("Please enter a tracking number.");
      return;
    }
    setShowModal(true);
  };
  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100"
      style={{
        background: "linear-gradient(135deg, #e3f2fd, #bbdefb)",
      }}
    >
      <div
        className="card shadow-lg p-5 border-0"
        style={{ maxWidth: "420px", width: "100%", borderRadius: "20px" }}
      >
        <div className="text-center mb-4">
          <img
            src={logo}
            alt="Envirocool Logo"
            style={{ height: "90px" }}
            className="mb-3"
          />
          <h3 className="fw-bold text-primary">Delivery Tracking</h3>
          <p className="text-muted small">
            Enter your tracking number to check the delivery status.
          </p>
        </div>

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-4" controlId="formTrackingNumber">
            <Form.Label className="fw-semibold">
              Enter Tracking Number:
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. ENV123456"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              style={{ padding: "14px", borderRadius: "12px" }}
            />
          </Form.Group>
          <div className="d-grid">
            <Button
              variant="primary"
              type="submit"
              style={{
                padding: "12px",
                borderRadius: "12px",
                fontWeight: "600",
              }}
            >
              Track Delivery
            </Button>
          </div>
        </Form>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Delivery Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <h5 className="mb-3">Tracking Number</h5>
            <p className="fw-bold fs-5 text-primary">{trackingNumber}</p>
            <div className="alert alert-info mt-3">
              🚚 Your package is currently <strong>In Transit</strong>.
            </div>
            <small className="text-muted">*Sample data for demo</small>
          </div>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-center">
          <Button
            variant="secondary"
            onClick={() => setShowModal(false)}
            style={{ borderRadius: "10px" }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CustomerTrackingPage;
