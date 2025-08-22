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

  const formatCurrency = (amount) =>
    `₱${Number(amount).toLocaleString("en-PH")}`;

  const fetchAssignedDeliveries = () => {
    const storedProfile = localStorage.getItem("user");
    if (!storedProfile) return;

    const parsedProfile = JSON.parse(storedProfile);
    const username = parsedProfile.pers_username;
    if (!username) return;

    axios
      .post(
        "http://localhost/DeliveryTrackingSystem/fetch_personnel_deliveries.php",
        {
          pers_username: username,
        }
      )
      .then((res) => {
        if (Array.isArray(res.data)) {
          const assigned = res.data.filter(
            (d) =>
              d.delivery_status === "To Ship" || d.delivery_status === "Pending"
          );

          const out = res.data.filter(
            (d) => d.delivery_status === "Out for Delivery"
          );

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
          fetchAssignedDeliveries(); 
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
              {/* Header */}
              <h5 className="text-center fw-bold text-dark mb-3">
                TRANSACTION NO. {delivery.transactionNo}
              </h5>

              <div className="border p-3 rounded bg-white">
                {/* Customer Info */}
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
                      <span>{formatCurrency(item.unitCost)}</span> |
                      <span>{formatCurrency(item.qty * item.unitCost)}</span>
                    </span>
                  </div>
                ))}

                <hr
                  className="my-2"
                  style={{
                    borderTop: "2px dashed #999",
                  }}
                />

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
