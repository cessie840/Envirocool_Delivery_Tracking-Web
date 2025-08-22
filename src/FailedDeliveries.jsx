import React, { useState, useEffect } from "react";
import { Container, Card } from "react-bootstrap";
import Sidebar from "./DriverSidebar";
import HeaderAndNav from "./DriverHeaderAndNav";
import axios from "axios";

function FailedDeliveries() {
  const [cancelledDeliveries, setCancelledDeliveries] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.pers_username) return;

    axios
      .post(
        "http://localhost/DeliveryTrackingSystem/fetch_cancelled_deliveries.php",
        {
          pers_username: user.pers_username,
        }
      )
      .then((res) => {
        if (res.data.success === false) {
          alert(res.data.message);
        } else {
          setCancelledDeliveries(res.data.data || []);
        }
      })
      .catch((err) => {
        console.error("Error fetching cancelled deliveries:", err);
        alert("Failed to fetch cancelled deliveries. Please try again later.");
      });
  }, []);

  // ✅ Helper function for formatting
  const formatCurrency = (amount) =>
    `₱${Number(amount).toLocaleString("en-PH")}`;

  return (
    <div style={{ backgroundColor: "#f0f4f7", minHeight: "100vh" }}>
      <HeaderAndNav onSidebarToggle={() => setShowSidebar(true)} />
      <Sidebar show={showSidebar} onHide={() => setShowSidebar(false)} />

      <Container className="py-4">
        <br />
        <h2 className="text-center text-danger fw-bold mb-3">
          CANCELLED / FAILED DELIVERIES
        </h2>
        <br />
        {cancelledDeliveries.length === 0 ? (
          <p className="text-muted text-center">
            No cancelled or failed deliveries.
          </p>
        ) : (
          cancelledDeliveries.map((delivery, idx) => (
            <Card
              key={idx}
              className="mb-4 p-3 border border-danger rounded"
              style={{ backgroundColor: "#fff0f0" }}
            >
              {/* Header */}
              <h5 className="text-center fw-bold text-dark mb-2">
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

                {/* Dashed Separator */}
                <hr
                  className="my-2"
                  style={{
                    borderTop: "2px dashed #999",
                  }}
                />
                {/* Total */}
                <div className="d-flex justify-content-between mb-3">
                  <strong>Total:</strong>
                  <span className="fw-bold">
                    {formatCurrency(delivery.totalCost)}
                  </span>
                </div>

                {/* Cancelled Reason */}
                <div className="d-flex justify-content-between mb-3">
                  <strong className="text-danger">
                    Reason for Cancellation:
                  </strong>
                  <strong className="text-danger mb-0">
                    {delivery.cancelledReason}
                  </strong>
                </div>
              </div>
            </Card>
          ))
        )}
      </Container>
    </div>
  );
}

export default FailedDeliveries;
