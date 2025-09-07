import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { Form, Button, Spinner } from "react-bootstrap";
import logo from "./assets/envirocool-logo.png";

const CustomerTrackingPage = () => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (trackingNumber.trim() === "") {
      alert("Please enter a tracking number.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost/DeliveryTrackingSystem/fetch_tracking_number.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ tracking_number: trackingNumber }),
        }
      );

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("trackingNumber", data.tracking_number);
        navigate("/customer");
      } else {
        alert(data.message || "Invalid tracking number.");
      }
    } catch (error) {
      console.error("Error verifying tracking number:", error);
      alert("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center min-vh-100"
      style={{
        background: "linear-gradient(135deg, #e3f2fd, #bbdefb)",
        padding: "20px",
      }}
    >
      <div
        className="card shadow-lg border-0 text-center"
        style={{
          maxWidth: "420px",
          width: "100%",
          borderRadius: "20px",
          padding: "40px 30px",
        }}
      >
        {/* Logo + Header */}
        <div className="mb-4">
          <img
            src={logo}
            alt="Envirocool Logo"
            style={{ height: "80px" }}
            className="mb-3"
          />
          <h3 className="fw-bold text-primary mb-2">Delivery Tracking</h3>
          <p className="text-muted small mb-0">
            Enter your tracking number to check your order status.
          </p>
        </div>

        {/* Tracking Form */}
        <Form onSubmit={handleSubmit} className="text-start">
          <Form.Group className="mb-4" controlId="formTrackingNumber">
            <Form.Label className="fw-semibold">Tracking Number</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. ENV123456"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              style={{
                padding: "14px",
                borderRadius: "12px",
                fontSize: "15px",
              }}
            />
          </Form.Group>
          <div className="d-grid">
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
              className="d-flex justify-content-center align-items-center gap-2"
              style={{
                padding: "12px",
                borderRadius: "12px",
                fontWeight: "600",
              }}
            >
              {loading && <Spinner animation="border" size="sm" />}
              {loading ? " Verifying..." : "Track Delivery"}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default CustomerTrackingPage;
