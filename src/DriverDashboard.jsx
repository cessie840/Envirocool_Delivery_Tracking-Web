import React, { useState, useEffect } from "react";
import { Button, Container, Card } from "react-bootstrap";
import axios from "axios";
import Sidebar from "./DriverSidebar";
import HeaderAndNav from "./DriverHeaderAndNav";

function DriverDashboard() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [assignedDeliveries, setAssignedDeliveries] = useState([]);
  const [outForDelivery, setOutForDelivery] = useState([]);

  useEffect(() => {
    const storedProfile = localStorage.getItem("user");
    if (!storedProfile) return;

    const parsedProfile = JSON.parse(storedProfile);
    const username = parsedProfile.pers_username;

    if (!username) {
      console.warn("No pers_username found in user data");
      return;
    }

    axios
      .post("http://localhost/DeliveryTrackingSystem/fetch_personnel_deliveries.php", {
        pers_username: username,
      })
      .then((res) => {
        if (Array.isArray(res.data)) {
          setAssignedDeliveries(res.data);
        } else {
          console.warn("Unexpected response format:", res.data);
        }
      })
      .catch((err) => {
        console.error("Error fetching deliveries:", err);
      });
  }, []);

  const markAsOutForDelivery = (transactionNo) => {
    const delivery = assignedDeliveries.find(
      (d) => d.transactionNo === transactionNo
    );
    if (!delivery) return;

    const updatedAssigned = assignedDeliveries.filter(
      (d) => d.transactionNo !== transactionNo
    );
    const updatedOut = [...outForDelivery, delivery];

    setAssignedDeliveries(updatedAssigned);
    setOutForDelivery(updatedOut);
  };

  return (
    <div style={{ backgroundColor: "#f0f4f7", minHeight: "100vh" }}>
      <HeaderAndNav onSidebarToggle={() => setShowSidebar(true)} />
      <Sidebar show={showSidebar} onHide={() => setShowSidebar(false)} />

      <Container className="py-4">
        <h2 className="text-center text-success fw-bold mb-3">
          ASSIGNED DELIVERIES
        </h2>

        {assignedDeliveries.length === 0 ? (
          <p className="text-muted text-center">No Assigned Deliveries.</p>
        ) : (
          assignedDeliveries.map((delivery, idx) => (
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
                <div className="mb-2">
                  <strong>Items:</strong>
                  <div className="ps-3">
                    {delivery.items.map((item, i) => (
                      <div key={i}>
                        {item.name} <strong>x{item.qty}</strong> – ₱{item.price}
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
                  onClick={() => markAsOutForDelivery(delivery.transactionNo)}
                >
                  Out for Delivery
                </Button>
              </div>
            </Card>
          ))
        )}
      </Container>
    </div>
  );
}

export default DriverDashboard;
