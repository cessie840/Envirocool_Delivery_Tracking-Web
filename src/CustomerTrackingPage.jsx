import React, { useState, useEffect } from "react";
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

    // For now, just open modal (later you can fetch data from backend)
    setShowModal(true);
  };
  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div
        className="card shadow-lg p-4"
        style={{ maxWidth: "400px", width: "100%" }}
      >
        <div className="text-center mb-4">
          <img
            src={logo}
            alt="Envirocool Logo"
            style={{ height: "80px" }}
            className="mb-2"
          />
          <h4 className="text-muted">Tracking Page</h4>
        </div>

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formTrackingNumber">
            <Form.Label>Enter Tracking Number</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. ENV123456"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </Form.Group>
          <div className="d-grid">
            <Button variant="primary" type="submit">
              Track
            </Button>
          </div>
        </Form>
      </div>

      {/* Tracking Result Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Tracking Result</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Tracking number: <strong>{trackingNumber}</strong>
          </p>
          <p>
            Status: <em>Pending / Sample Data</em>
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CustomerTrackingPage;
