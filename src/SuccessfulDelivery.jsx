import React, { useState, useEffect } from "react";
import { Container, Card } from "react-bootstrap";
import Sidebar from "./DriverSidebar";
import HeaderAndNav from "./DriverHeaderAndNav";

function SuccessfulDelivery() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [delivered, setDelivered] = useState([]);

  useEffect(() => {
    const storedDelivered = localStorage.getItem("delivered");
    setDelivered(storedDelivered ? JSON.parse(storedDelivered) : []);
  }, []);

  return (
    <div style={{ backgroundColor: "#f0f4f7", minHeight: "100vh" }}>
      <HeaderAndNav onSidebarToggle={() => setShowSidebar(true)} />
      <Sidebar show={showSidebar} onHide={() => setShowSidebar(false)} />

      <Container className="py-4">
        <br />
        <h2 className="text-center text-success fw-bold mb-3">
          SUCCESSFUL DELIVERIES
        </h2>
        <br />
        {delivered.length === 0 ? (
          <p className="text-muted text-center">
            No Successful Deliveries found.
          </p>
        ) : (
          delivered.map((delivery, idx) => (
            <Card
              key={idx}
              className="mb-4 p-3 border border-success rounded"
              style={{ backgroundColor: "#e9f9ed" }}
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
                <div className="d-flex justify-content-between mb-1">
                  <strong>Items:</strong>
                  <div>
                    {delivery.items.map((item, i) => (
                      <div key={i}>
                        {item.name} <strong>x{item.qty}</strong>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <strong>Unit Cost:</strong>
                  <span>{delivery.unitCost}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <strong>Total Cost:</strong>
                  <span>{delivery.totalCost}</span>
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
