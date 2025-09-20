import React, { useState, useEffect } from "react";
import { Button, Container, Card, Modal, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Sidebar from "./DriverSidebar";
import HeaderAndNav from "./DriverHeaderAndNav";
import axios from "axios";

function OutForDelivery() {
  const [deliveries, setDeliveries] = useState([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

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
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        setDeliveries(data);
        setFilteredDeliveries(data);
      })
      .catch((err) => {
        console.error("Error fetching deliveries:", err);
        alert("Failed to fetch deliveries. Please try again later.");
      });
  }, []);

  // Filter deliveries based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredDeliveries(deliveries);
    } else {
      const filtered = deliveries.filter(
        (d) =>
          d.transactionNo.toString().includes(searchTerm) ||
          d.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDeliveries(filtered);
    }
  }, [searchTerm, deliveries]);

  const markAsDelivered = (transactionNo) => {
    const delivery = deliveries.find((d) => d.transactionNo === transactionNo);
    if (!delivery) return;

    axios
      .post(
        "http://localhost/DeliveryTrackingSystem/update_delivered_status.php",
        {
          transaction_id: transactionNo,
          status: "Delivered",
        }
      )
      .then((res) => {
        if (res.data.success) {
          setDeliveries(
            deliveries.filter((d) => d.transactionNo !== transactionNo)
          );
          setFilteredDeliveries(
            filteredDeliveries.filter((d) => d.transactionNo !== transactionNo)
          );
          navigate("/successful-delivery");
        } else alert(res.data.message);
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to update delivery status.");
      });
  };

  const handleCancelClick = (delivery) => {
    setSelectedDelivery(delivery);
    setShowCancelModal(true);
  };

  const confirmCancellation = () => {
    if (!cancelReason) return alert("Please select a cancellation reason.");

    axios
      .post("http://localhost/DeliveryTrackingSystem/cancelled_delivery.php", {
        transaction_id: selectedDelivery.transactionNo,
        reason: cancelReason,
      })
      .then((res) => {
        if (res.data.success) {
          setDeliveries(
            deliveries.filter(
              (d) => d.transactionNo !== selectedDelivery.transactionNo
            )
          );
          setFilteredDeliveries(
            filteredDeliveries.filter(
              (d) => d.transactionNo !== selectedDelivery.transactionNo
            )
          );
          setShowCancelModal(false);
          setSelectedDelivery(null);
          setCancelReason("");
          navigate("/failed-delivery");
        } else alert(res.data.message);
      })
      .catch((err) => {
        console.error(err);
        alert("Error cancelling delivery.");
      });
  };

  return (
    <div style={{ backgroundColor: "#f0f4f7", minHeight: "100vh" }}>
      <HeaderAndNav
        onSidebarToggle={() => setShowSidebar(true)}
        onSearch={setSearchTerm}
      />
      <Sidebar show={showSidebar} onHide={() => setShowSidebar(false)} />

      <Container className="py-4">
        <br />
        <h2 className="text-center text-success fw-bold mb-3">
          OUT FOR DELIVERY
        </h2>
        <br />
        {filteredDeliveries.length === 0 ? (
          <p className="text-muted text-center">No deliveries found.</p>
        ) : (
          filteredDeliveries.map((delivery, idx) => (
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

                <hr className="my-2" style={{ borderTop: "2px dashed #999" }} />

                <div className="d-flex justify-content-between mb-3">
                  <strong>Total:</strong>
                  <span className="fw-bold">
                    {formatCurrency(delivery.totalCost)}
                  </span>
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
                  Mark as Delivered
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  style={{ borderRadius: "10px" }}
                  onClick={() => handleCancelClick(delivery)}
                >
                  Delivery Attempt Failed
                </Button>
              </div>
            </Card>
          ))
        )}
      </Container>

      <Modal
        show={showCancelModal}
        onHide={() => setShowCancelModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Select Cancellation Reason</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-white">
          <Form.Select
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          >
            <option value="">-- Select Reason --</option>
            <option value="Vehicle-related Issue">Vehicle-related issue</option>
            <option value="Location Inaccessible">Location inaccessible</option>
          </Form.Select>
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
