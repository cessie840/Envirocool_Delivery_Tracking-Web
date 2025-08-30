import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Modal, Button } from "react-bootstrap";
import logo from "./assets/envirocool-logo.png";

// Leaflet icon fix
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import deliveryIconImg from "./assets/delivery-icon.png";

const customDeliveryIcon = new L.Icon({
  iconUrl: deliveryIconImg,
  iconSize: [35, 45],
  iconAnchor: [17, 45],
  popupAnchor: [0, -45],
});

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const Customer = () => {
  const [deliveryStatus, setDeliveryStatus] = useState("Delivered");
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showSubmittedModal, setShowSubmittedModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [currentLocation, setCurrentLocation] = useState([
    14.259465, 121.133783,
  ]);

  const fromPosition = [14.211111, 121.153333];
  const customerPosition = [14.273689, 121.113284];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLocation((prev) => [
        prev[0] + 0.0001 * (Math.random() - 0.5),
        prev[1] + 0.0001 * (Math.random() - 0.5),
      ]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const transaction = {
    id: "ENV100001",
    from: "Envirocool Corporation Parian, Calamba, Laguna",
    to: "Veracruz Homes, Malitlit, Sta. Rosa, Laguna",
    eta: "2:22 PM",
    receiver: "Jessa Cariñaga",
    driver: { name: "Monkey D. Luffy" },
    status: deliveryStatus,
  };

  const steps = ["Order Placed", "Pending", "Out for Delivery", "Delivered"];
  const currentStep = steps.indexOf(deliveryStatus) + 1;

  const handleSubmit = () => {
    if (rating === 0)
      return alert("Please provide a rating before submitting.");
    setSubmitted(true);
    setShowRatingModal(false);
    setShowSubmittedModal(true);
  };

  return (
    <div
      className="d-flex justify-content-center align-items-start py-4"
      style={{
        background: "linear-gradient(135deg, #e3f2fd, #bbdefb)",
        minHeight: "100vh",
      }}
    >
      <div
        className="card shadow-lg p-3 p-md-4 border-0 w-100"
        style={{ maxWidth: "1000px", borderRadius: "20px" }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <img
            src={logo}
            alt="Envirocool Logo"
            style={{ height: "70px" }}
            className="mb-2"
          />
          <h4 className="fw-bold text-primary">Delivery Tracking</h4>
          <p className="text-muted small mb-0">
            Track your Envirocool package in real-time
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
          {steps.map((step, index) => (
            <div key={index} className="text-center flex-fill mb-3">
              <div
                className={`rounded-circle mx-auto mb-2 d-flex justify-content-center align-items-center ${
                  index < currentStep
                    ? "bg-primary text-white"
                    : "bg-light border"
                }`}
                style={{ width: "40px", height: "40px", fontSize: "16px" }}
              >
                {index + 1}
              </div>
              <small
                className={
                  index < currentStep ? "fw-bold text-primary" : "text-muted"
                }
              >
                {step}
              </small>
            </div>
          ))}
        </div>

        {/* Tracking Summary */}
        <div className="card mb-4 border-0 shadow-sm">
          <div className="card-body d-flex flex-column flex-sm-row justify-content-between align-items-sm-center">
            <div className="mb-3 mb-sm-0">
              <h6 className="fw-bold">Tracking Number: {transaction.id}</h6>
              <p className="mb-1">
                <strong>Status:</strong> {transaction.status}
              </p>
              <p className="mb-0">
                <strong>ETA:</strong> {transaction.eta}
              </p>
            </div>
            <div>
              <span
                className={`badge fs-6 ${
                  deliveryStatus === "Delivered"
                    ? "bg-success"
                    : "bg-warning text-dark"
                }`}
              >
                {transaction.status}
              </span>
            </div>
          </div>
        </div>

        {/* Map */}
        <div
          className="mb-4 rounded shadow-sm overflow-hidden"
          style={{ height: "300px" }}
        >
          <MapContainer
            center={currentLocation}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={fromPosition}>
              <Popup>Pickup Location</Popup>
            </Marker>
            <Marker position={currentLocation} icon={customDeliveryIcon}>
              <Popup>Delivery Vehicle (Current Location)</Popup>
            </Marker>
            <Marker position={customerPosition}>
              <Popup>Your Location</Popup>
            </Marker>
            <Polyline
              positions={[fromPosition, currentLocation]}
              color="#0d6efd"
              dashArray="8,8"
            />
          </MapContainer>
        </div>

        {/* Delivery Details */}
        <div className="card mb-4 border-0 shadow-sm">
          <div className="card-body">
            <h6 className="fw-bold mb-3">Delivery Details:</h6>
            <div className="row">
              <div className="col-12 col-md-6 mb-2">
                <p>
                  <strong>From:</strong> {transaction.from}
                </p>
                <p>
                  <strong>To:</strong> {transaction.to}
                </p>
                <p>
                  <strong>Receiver:</strong> {transaction.receiver}
                </p>
              </div>
              <div className="col-12 col-md-6 mb-2">
                <p>
                  <strong>Delivery Personnel:</strong> {transaction.driver.name}
                </p>
                <p>
                  <strong>Estimated Arrival:</strong> {transaction.eta}
                </p>
              </div>
            </div>

            {deliveryStatus === "Delivered" && !submitted && (
              <div className="text-center mt-3">
                <Button
                  variant="primary"
                  onClick={() => setShowRatingModal(true)}
                >
                  Order Received
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      <Modal
        show={showRatingModal && !submitted}
        onHide={() => setShowRatingModal(false)}
        centered
      >
        <Modal.Header>
          <Modal.Title className="text-center">Rate Your Delivery</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-center">
            How satisfied are you with this delivery?
          </p>
          <div className="d-flex justify-content-center mb-3 flex-wrap">
            {[1, 2, 3, 4, 5].map((num) => (
              <span
                key={num}
                onClick={() => setRating(num)}
                style={{
                  fontSize: "2.5rem",
                  color: rating >= num ? "#FFC107" : "#e4e5e9",
                  cursor: "pointer",
                }}
              >
                ★
              </span>
            ))}
          </div>
          <div className="mb-3">
            <label className="form-label">Optional Feedback</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Share your feedback..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            ></textarea>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={rating === 0}
          >
            Submit Rating
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Submitted Feedback Modal */}
      <Modal
        show={showSubmittedModal}
        onHide={() => setShowSubmittedModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>✅ Feedback Submitted</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <p>Thank you! Your feedback has been successfully submitted.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="success"
            onClick={() => setShowSubmittedModal(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Customer;
