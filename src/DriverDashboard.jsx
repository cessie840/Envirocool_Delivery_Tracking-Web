import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Card,
  Button,
  Navbar,
  Form,
  InputGroup,
  Offcanvas,
  ListGroup,
  Image,
} from "react-bootstrap";

import Sidebar from "./DriverSidebar";
import HeaderAndNav from "./DriverHeaderAndNav";

{
  /* EXAMPLE CONTENTS */
}
const mockDeliveries = [
  {
    transactionNo: "000000001",
    customerName: "Dudong Batumbakal",
    address: "Marinig, Cabuyao, Laguna",
    contact: "09123456789",
    paymentMode: "Cash On Delivery",
    items: [
      { name: "Item #1", qty: 1 },
      { name: "Item #2", qty: 2 },
    ],
    unitCost: "₱5,899.75",
    totalCost: "₱5,899.75",
  },
  {
    transactionNo: "000000002",
    customerName: "Dudong Batumbakal",
    address: "Marinig, Cabuyao, Laguna",
    contact: "09123456789",
    paymentMode: "Cash On Delivery",
    items: [
      { name: "Item #1", qty: 1 },
      { name: "Item #2", qty: 2 },
    ],
    unitCost: "₱5,899.75",
    totalCost: "₱5,899.75",
  },
];

function DriverDashboard() {
  const [showSidebar, setShowSidebar] = useState(false);

  const [assignedDeliveries, setAssignedDeliveries] = useState(() => {
    const saved = localStorage.getItem("assignedDeliveries");
    return saved ? JSON.parse(saved) : mockDeliveries;
  });

  const [outForDelivery, setOutForDelivery] = useState(() => {
    const saved = localStorage.getItem("outForDelivery");
    return saved ? JSON.parse(saved) : [];
  });

  const markAsOutForDelivery = (transactionNo) => {
    const delivery = assignedDeliveries.find(
      (d) => d.transactionNo === transactionNo
    );
    const updatedAssigned = assignedDeliveries.filter(
      (d) => d.transactionNo !== transactionNo
    );
    const updatedOut = [...outForDelivery, delivery];

    setAssignedDeliveries(updatedAssigned);
    setOutForDelivery(updatedOut);

    localStorage.setItem("assignedDeliveries", JSON.stringify(updatedAssigned));
    localStorage.setItem("outForDelivery", JSON.stringify(updatedOut));
  };

  return (
    <div style={{ backgroundColor: "#f0f4f7", minHeight: "100vh" }}>
      <HeaderAndNav onSidebarToggle={() => setShowSidebar(true)} />
      <Sidebar show={showSidebar} onHide={() => setShowSidebar(false)} />

      {/* ASSIGNED DELIVERIES*/}
      <Container className="py-4">
        <br />
        <h2 className="text-center text-success fw-bold mb-3">
          ASSIGNED DELIVERIES
        </h2>
        <br />
        {assignedDeliveries.map((delivery, idx) => (
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
        ))}
      </Container>
    </div>
  );
}

export default DriverDashboard;
