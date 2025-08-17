import React, { useState, useEffect } from "react";
import { Button, Container, Card } from "react-bootstrap";
import axios from "axios";
import Sidebar from "./DriverSidebar";
import HeaderAndNav from "./DriverHeaderAndNav";
import { useNavigate } from "react-router-dom";

function DriverDashboard() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [assignedDeliveries, setAssignedDeliveries] = useState([]);
  const [outForDelivery, setOutForDelivery] = useState([]);
  const navigate = useNavigate();

  // Fetch assigned deliveries
  const fetchAssignedDeliveries = () => {
    const storedProfile = localStorage.getItem("user");
    if (!storedProfile) return;

    const parsedProfile = JSON.parse(storedProfile);
console.log("Parsed profile from localStorage:", parsedProfile);
const username = parsedProfile.pers_username;
console.log("Username being sent to backend:", username);


    if (!username) return;

    axios
  .post("http://localhost/DeliveryTrackingSystem/fetch_personnel_deliveries.php", {
    pers_username: username,
  })
  .then((res) => {
    console.log("Fetched deliveries:", res.data);
    if (Array.isArray(res.data)) {
     const assigned = res.data.filter(
  (d) => d.delivery_status === "To Ship" || d.delivery_status === "Pending"
);

      const out = res.data.filter((d) => d.delivery_status === "Out for Delivery");

      setAssignedDeliveries(assigned);
      setOutForDelivery(out);
    } else {
      console.warn("Unexpected response format:", res.data);
    }
  })
  .catch((err) => console.error("Error fetching deliveries:", err));
  };

  useEffect(() => {
    fetchAssignedDeliveries();
  }, []);

const markAsOutForDelivery = (transactionNo) => {
  const delivery = assignedDeliveries.find(
    (d) => d.transactionNo === transactionNo
  );
  if (!delivery) {
    alert("Delivery not found.");
    return;
  }

  axios
    .post(
      "http://localhost/DeliveryTrackingSystem/update_out_of_order_status.php",
      { transaction_id: transactionNo }
    )
    .then((res) => {
      const { success, message } = res.data;

      if (success) {
        alert("Order is now marked as 'Out for Delivery'.");
        fetchAssignedDeliveries(); // refresh list
        navigate("/out-for-delivery");
      } else {
        alert(`Error: ${message}`);
      }
    })
    .catch((err) => {
      if (err.response) {
        const { status, data } = err.response;
        alert(`Error ${status}: ${data?.message || "Something went wrong."}`);
      } else {
        console.error("API error:", err);
        alert("Failed to update delivery status. Please try again later.");
      }
    });
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