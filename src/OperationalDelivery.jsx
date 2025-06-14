import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import OperationalLayout from "./OperationalLayout";

const OperationalDelivery = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    document.title = "Operational Delivery";
  }, []);

  const orders = [
    {
      transactionNo: "000000001",
      customerName: "Daniel Padila",
      customerAddress: "123 Main St",
      contactNumber: "09123456789",
      paymentMode: "Cash On Delivery",
      items: [
        { name: "Samsung S-Inverter Split Type Aircon", quantity: 4, price: 6000 },
      ],
      totalCost: 24000,
    },
    {
      transactionNo: "000000002",
      customerName: "Mima Otlum",
      customerAddress: "456 High St",
      contactNumber: "09987654321",
      paymentMode: "GCash",
      items: [
        { name: "Carrier Window Type Aircon", quantity: 2, price: 5000 },
      ],
      totalCost: 10000,
    },
  ];

  const handleAssignPersonnel = () => {
    console.log("Assigned to:", selectedPersonnel);
    setShowModal(false);
  };

  const openDetailModal = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  return (
    <OperationalLayout title="Delivery Orders">
      <div className="compact-container container mt-5 pb-5 px-5 rounded-2">
        <div className="row mt-5">
          {orders.map((order, index) => (
            <div key={index} className="col-md-6">
              <div className="compact-card card shadow-sm rounded-2 p-3 m-2">
                <h5 className="fw-bold text-success">Transaction #{order.transactionNo}</h5>
                <p className="mb-2"><strong>Customer:</strong> {order.customerName}</p>
                <div className="text-end">
                  <Button className="btn-view" size="sm" onClick={() => openDetailModal(order)}>
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: View Order Details */}
      {selectedOrder && (
        <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered   dialogClassName={showModal ? "dimmed-modal" : ""}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold text-success text-center">
              Transaction #{selectedOrder.transactionNo}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="p-3 bg-light border rounded-3">
              <h5 className="text-success">Customer Details</h5>
              <p><strong>Name:</strong> {selectedOrder.customerName}</p>
              <p><strong>Address:</strong> {selectedOrder.customerAddress}</p>
              <p><strong>Contact:</strong> {selectedOrder.contactNumber}</p>
              <p><strong>Payment Mode:</strong> {selectedOrder.paymentMode}</p>
            </div>

            <div className="p-3 mt-3 bg-light border rounded-3">
              <h5 className="text-success">Items Ordered</h5>
              <ul className="list-group list-group-flush">
                {selectedOrder.items.map((item, idx) => (
                  <li key={idx} className="list-group-item d-flex justify-content-between">
                    <span>{item.name} x{item.quantity}</span>
                    <span className="fw-bold">₱{item.price}</span>
                  </li>
                ))}
              </ul>
              <div className="text-end mt-3">
                <h5 className="fw-bold text-success">Total Cost: ₱{selectedOrder.totalCost}</h5>
              </div>
            </div>

            <div className="text-center mt-4">
              <Button variant="success" className="btn-view" onClick={() => setShowModal(true)}>
                Assign Delivery Personnel
              </Button>
            </div>
          </Modal.Body>
        </Modal>
      )}

      {/* MODAL: Assign Personnel */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-success">Assign Delivery Personnel</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label><strong>Available Personnel:</strong></Form.Label>
            <Form.Select
              value={selectedPersonnel}
              onChange={(e) => setSelectedPersonnel(e.target.value)}
            >
              <option value="">Select personnel...</option>
              <option value="Jessa Cariñaga">Jessa Cariñaga</option>
              <option value="Princess Maniclang">Princess Maniclang</option>
              <option value="Miriam Mulawin">Miriam Mulawin</option>
              <option value="Liezel Patiente">Liezel Patiente</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button className="add-btn bg-success p-1 px-3 fw-normal border-0 rounded-2" onClick={handleAssignPersonnel}>Assign</Button>
        </Modal.Footer>
      </Modal>
    </OperationalLayout>
  );
};

export default OperationalDelivery;
