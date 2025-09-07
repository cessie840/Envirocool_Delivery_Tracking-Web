import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { Card, Button, Modal, Form } from "react-bootstrap";

const Customer = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const trackingNumber = queryParams.get("trackingNumber");

  const [delivery, setDelivery] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Customer satisfaction modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!trackingNumber) {
      setError("Tracking number is missing.");
      setLoading(false);
      return;
    }

    const fetchDelivery = async () => {
      try {
        const response = await fetch(
          "http://localhost/DeliveryTrackingSystem/get_delivery_by_tracking.php",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tracking_number: trackingNumber }),
          }
        );

        const data = await response.json();
        if (data.success) {
          setDelivery(data.transaction);
          setItems(data.items);
        } else {
          setError(data.message || "Delivery not found.");
        }
      } catch (err) {
        setError("Failed to fetch delivery details.");
      } finally {
        setLoading(false);
      }
    };

    fetchDelivery();
  }, [trackingNumber]);

  const handleReviewSubmit = async () => {
    if (!rating) {
      alert("Please select a rating before submitting.");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost/DeliveryTrackingSystem/save_feedback.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tracking_number: trackingNumber,
            rating,
            feedback,
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        alert("Thank you for your feedback!");
        setShowReviewModal(false);
        setRating(0);
        setFeedback("");
      } else {
        alert(result.message || "Failed to save feedback.");
      }
    } catch (err) {
      alert("Error submitting feedback.");
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <h4>Loading...</h4>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <h4 className="text-danger">{error}</h4>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h2 className="text-center mb-4 text-primary">Delivery Details</h2>

      <Card className="shadow-lg p-4 border-0 rounded-4">
        <h5 className="mb-3">
          Tracking Number:{" "}
          <span className="text-muted">{delivery.tracking_number}</span>
        </h5>
        <p>
          <strong>Status:</strong> {delivery.delivery_status}
        </p>
        <p>
          <strong>Customer:</strong> {delivery.customer_name}
        </p>
        <p>
          <strong>Address:</strong> {delivery.customer_address}
        </p>
        <p>
          <strong>Contact:</strong> {delivery.customer_contact}
        </p>
        <p>
          <strong>Date of Order:</strong> {delivery.date_of_order}
        </p>
        <p>
          <strong>Target Delivery:</strong> {delivery.target_date_delivery}
        </p>
        <p>
          <strong>Payment Method:</strong> {delivery.mode_of_payment} (
          {delivery.payment_option})
        </p>
        <p>
          <strong>Total Amount:</strong> ₱{delivery.total}
        </p>

        <h6 className="mt-4">Items Ordered</h6>
        <ul>
          {items.map((item, idx) => (
            <li key={idx}>
              {item.description} — {item.quantity}
            </li>
          ))}
        </ul>

        {delivery.delivery_status === "Delivered" && (
          <div className="mt-4">
            <Button variant="success" onClick={() => setShowReviewModal(true)}>
              Order Received - Leave Feedback
            </Button>
          </div>
        )}
      </Card>

      {/* Review Modal */}
      <Modal
        show={showReviewModal}
        onHide={() => setShowReviewModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Customer Satisfaction</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Rating (1–5)</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max="5"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Feedback</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReviewModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleReviewSubmit}>
            Submit Feedback
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Customer;
