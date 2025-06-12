import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { Modal, Button, Form } from "react-bootstrap";
import OperationalLayout from "./OperationalLayout"; 

const OperationalDelivery = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState("");

   useEffect(() => {
    document.title = "Order Details";
  }, []);

  const [orderDetails] = useState({
    customerName: "Daniel Padila",
    customerAddress: "123 Main St",
    contactNumber: "09123456789",
    paymentMode: "Cash On Delivery",
    items: [
      { name: "Samsung S-Inverter Split Type Aircon", quantity: 4, price: 6000 },
    ],
    totalCost: 24000,
  });

  const handleAssignPersonnel = () => {
    console.log("Assigned to:", selectedPersonnel);
    setShowModal(false);
  };

  return (
    <OperationalLayout title="View Order Details">
      <div className="d-flex justify-content-between mx-4 my-4">
        <button
          className="back btn rounded-2 px-3 py-1 fs-4"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft className="me-2" />
        </button>
      </div>

      <div className="container mt-3 w-75">
        <div className="card shadow-lg border-0 rounded-4">
          <div className="card-body border border-2 rounded-4">
            <h3 className="card-title text-center fw-bold text-success">
              Transaction No. 000000001
            </h3>
            <hr />

            <div className="mb-3 p-3 bg-light border rounded-3 shadow-sm">
              <h5 className="text-success">Customer Details</h5>
              <p><strong>Name:</strong> {orderDetails.customerName}</p>
              <p><strong>Address:</strong> {orderDetails.customerAddress}</p>
              <p><strong>Contact:</strong> {orderDetails.contactNumber}</p>
              <p><strong>Payment Mode:</strong> {orderDetails.paymentMode}</p>
            </div>

            <div className="mb-3 p-3 bg-light border rounded-3 shadow-sm">
              <h5 className="text-success">Items Ordered</h5>
              <ul className="list-group list-group-flush">
                {orderDetails.items.map((item, index) => (
                  <li
                    key={index}
                    className="list-group-item d-flex justify-content-between"
                  >
                    <span>{item.name} x{item.quantity}</span>
                    <span className="fw-bold">₱{item.price}</span>
                  </li>
                ))}
              </ul>
              <div className="text-end mt-4">
                <h4 className="fw-bold text-success m-3">
                  Total Cost: ₱{orderDetails.totalCost}
                </h4>
              </div>
            </div>

            <div className="buttons d-flex justify-content-center gap-5 mt-4 mb-2">
              <button
                className="add-btn bg-success px-5 rounded-3"
                onClick={() => setShowModal(true)}
              >
                Assign Delivery Personnel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title className="fw-bold text-success">
            ASSIGN DELIVERY PERSONNEL
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body-custom">
          <Form.Group className="mb-3">
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
          <Button variant="success" className="px-4 py-1" onClick={handleAssignPersonnel}>
            Assign
          </Button>
        </Modal.Footer>
      </Modal>
    </OperationalLayout>
  );
};

export default OperationalDelivery;
