import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
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
  const [currentLocation, setCurrentLocation] = useState([14.259465363913165, 121.13378332309895]);

  const fromPosition = [14.211111, 121.153333];
  const customerPosition = [14.273689855367394, 121.1132842672735];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLocation(prev => [
        prev[0] + 0.0001 * (Math.random() - 0.5),
        prev[1] + 0.0001 * (Math.random() - 0.5),
      ]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const transaction = {
    id: 100001,
    from: "Envirocool Corporation Parian, Calamba, Laguna",
    to: "Veracruz Homes, Malitlit, Sta. Rosa, Laguna",
    eta: "2:22 PM",
    receiver: "Jessa Cariñaga",
    driver: {
      name: "Monkey D. Luffy"
    },
    status: deliveryStatus,
  };

  const handleSubmit = () => {
    if (rating === 0) return alert("Please provide a rating before submitting.");
    setSubmitted(true);
    setShowRatingModal(false);
    setShowSubmittedModal(true);
    console.log({ rating, feedback });
  };

  const handleReceivedClick = () => {
    setShowRatingModal(true);
  };

  return (
    <div className="container py-4">
      <div className="text-center mb-4">
        <img src={logo} alt="Envirocool Logo" style={{ height: "100px" }} className="mb-2" />
        <h4 className="text-muted fs-5">Track Your Envirocool Delivery Here.</h4>
      </div>

      <div className="mb-4 rounded shadow" style={{ height: "500px" }}>
        <MapContainer center={currentLocation} zoom={13} style={{ height: "100%", width: "100%" }}>
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
          <Polyline positions={[fromPosition, currentLocation]} color="#f06" dashArray="10,10" />
        </MapContainer>
      </div>

      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h5 className="card-title text-center fs-4">Transaction #{transaction.id}</h5>
          <div className="row">
            <div className="col-md-6">
              <p><strong>From:</strong> {transaction.from}</p>
              <p><strong>To:</strong> {transaction.to}</p>
              <p><strong>ETA:</strong> {transaction.eta}</p>
            </div>
            <div className="col-md-6">
              <p><strong>Receiver:</strong> {transaction.receiver}</p>
              <p><strong>Delivery Personnel:</strong> {transaction.driver.name}</p>
              <p>
                <strong>Status:</strong>{" "}
                <span className={`badge ${deliveryStatus === "Delivered" ? "bg-success" : "bg-warning text-dark"}`}>
                  {transaction.status}
                </span>
              </p>
            </div>
          </div>

          {deliveryStatus === "Delivered" && !submitted && (
            <div className="text-center mt-3">
              <Button className="btn-received" onClick={handleReceivedClick}>
                Order Received
              </Button>
            </div>
          )}
        </div>
      </div>

      <Modal show={showRatingModal && !submitted} onHide={() => setShowRatingModal(false)} centered>
        <Modal.Header>
          <Modal.Title className="text-center">Rate Your Delivery</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-center">How satisfied are you with this delivery?</p>
          <div className="d-flex justify-content-center mb-3">
            {[1, 2, 3, 4, 5].map((num) => (
              <span
                key={num}
                onClick={() => setRating(num)}
                style={{
                  fontSize: "3rem",
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
          <Button variant="primary" onClick={handleSubmit} disabled={rating === 0}>
            Submit Rating
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showSubmittedModal} onHide={() => setShowSubmittedModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>✅ Feedback Submitted</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <p>Thank you! Your feedback has been successfully submitted.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="success" onClick={() => setShowSubmittedModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Customer;