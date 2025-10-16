import React, { useState, useEffect } from "react";
import { Container, Card } from "react-bootstrap";
import Sidebar from "./DriverSidebar";
import HeaderAndNav from "./DriverHeaderAndNav";
import axios from "axios";

function SuccessfulDelivery() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [delivered, setDelivered] = useState([]);
  const [filteredDelivered, setFilteredDelivered] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.pers_username) return;

    axios
      .post(
        "http://localhost/DeliveryTrackingSystem/fetch_delivered_deliveries.php",
        {
          pers_username: user.pers_username,
        }
      )
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        setDelivered(data);
        setFilteredDelivered(data);
      })
      .catch((err) => {
        console.error("Error fetching deliveries:", err);
        alert("Failed to fetch deliveries. Please try again later.");
      });
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredDelivered(delivered);
    } else {
      const filtered = delivered.filter(
        (d) =>
          d.transactionNo.toString().includes(searchTerm) ||
          d.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDelivered(filtered);
    }
  }, [searchTerm, delivered]);

  const formatCurrency = (amount) =>
    `₱${Number(amount).toLocaleString("en-PH")}`;

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
          SUCCESSFUL DELIVERIES
        </h2>
        <br />

        {filteredDelivered.length === 0 ? (
          <p className="text-muted text-center">
            No Successful Deliveries found.
          </p>
        ) : (
          filteredDelivered.map((delivery, idx) => (
            <Card
              key={idx}
              className="mb-4 p-3 border border-success rounded"
              style={{ backgroundColor: "#e9f9ed" }}
            >
              <h5 className="text-center fw-bold text-dark mb-2">
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
                      <span>{formatCurrency(item.unitCost)}</span> |
                      <span>{formatCurrency(item.subtotal)}</span>
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
            </Card>
          ))
        )}
      </Container>
    </div>
  );
}

export default SuccessfulDelivery;
