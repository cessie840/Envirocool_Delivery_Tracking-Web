import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import OperationalLayout from "./OperationalLayout";
import axios from "axios";

const OperationalDelivery = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [personnelList, setPersonnelList] = useState([]);

  useEffect(() => {
    document.title = "Operational Delivery";
    fetchOrders();
  }, []);

  useEffect(() => {
    if (showModal) {
      fetchPersonnel();
    }
  }, [showModal]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(
        "http://localhost/DeliveryTrackingSystem/fetch_delivery_orders.php"
      );

      console.log("Fetched Orders:", res.data);
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]); 
    }
  };

  const fetchPersonnel = async () => {
    try {
      const res = await axios.get(
        "http://localhost/DeliveryTrackingSystem/fetch_delivery_personnel.php"
      );

      console.log("✅ Personnel fetched:", res.data); 
      setPersonnelList(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("❌ Failed to fetch personnel:", error);
      setPersonnelList([]); 
    }
  };

  const handleOpenAssignModal = () => {
    setSelectedPersonnel(""); 
    setShowModal(true);
  };

  const handleAssignPersonnel = async () => {
    try {
      await axios.get(
        "http://localhost/DeliveryTrackingSystem/fetch_delivery_personnel.php",
        {
          orderId: selectedOrder.transaction_no,
          personnelUsername: selectedPersonnel,
        }
      );
      alert("Personnel assigned!");
      setShowModal(false);
      setShowDetailModal(false);
      fetchOrders();
    } catch (error) {
      console.error("Assignment failed:", error);
      alert("Assignment failed.");
    }
  };

  const openDetailModal = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  return (
    <OperationalLayout title="Delivery Orders">
      <div className="compact-container container mt-5 pb-5 px-5 rounded-2">
        <div className="row mt-5">
          {orders.length === 0 ? (
            <div className="col-12 text-center text-muted my-5">
              <h5>No delivery orders available.</h5>
            </div>
          ) : (
            orders.map((order, index) => (
              <div key={index} className="col-md-6">
                <div className="compact-card card shadow-sm rounded-2 p-3 m-2">
                  <h5 className="fw-bold text-success">
                    Transaction No. {order.transaction_no}
                  </h5>
                  <p className="mb-2">
                    <strong>Customer:</strong> {order.customer_name}
                  </p>
                  <div className="text-end">
                    <Button
                      className="btn-view"
                      size="sm"
                      onClick={() => openDetailModal(order)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL: View Order Details */}
      {selectedOrder && (
        <Modal
          show={showDetailModal}
          onHide={() => setShowDetailModal(false)}
          size="lg"
          centered
          dialogClassName={showModal ? "dimmed-modal" : ""}
        >
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold text-success text-center">
              Transaction #{selectedOrder.transaction_no}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="p-3 bg-light border rounded-3">
              <h5 className="text-success">Customer Details</h5>
              <p>
                <strong>Name:</strong> {selectedOrder.customer_name}
              </p>
              <p>
                <strong>Address:</strong> {selectedOrder.customer_address}
              </p>
              <p>
                <strong>Contact:</strong> {selectedOrder.contact_number}
              </p>
              <p>
                <strong>Payment Mode:</strong> {selectedOrder.payment_mode}
              </p>
            </div>

            <div className="p-3 mt-3 bg-light border rounded-3">
              <h5 className="text-success">Items Ordered</h5>
              <ul className="list-group list-group-flush">
                {Array.isArray(selectedOrder.items) &&
                selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, idx) => (
                    <li
                      key={idx}
                      className="list-group-item d-flex justify-content-between"
                    >
                      <span>
                        {item.name} x{item.quantity}
                      </span>
                      <span className="fw-bold">₱{item.price}</span>
                    </li>
                  ))
                ) : (
                  <li className="list-group-item text-muted">
                    No items found.
                  </li>
                )}
              </ul>
              <div className="text-end mt-3">
                <h5 className="fw-bold text-success">
                  Total Cost: ₱{selectedOrder.total_cost}
                </h5>
              </div>
            </div>

            <div className="text-center mt-4">
              <Button
                variant="success"
                className="btn-view"
                onClick={handleOpenAssignModal}
              >
                Assign Delivery Personnel
              </Button>
            </div>
          </Modal.Body>
        </Modal>
      )}

      {/* MODAL: Assign Personnel */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-success">
            Assign Delivery Personnel
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>
              <strong>Available Personnel:</strong>
            </Form.Label>
            <Form.Select
              value={selectedPersonnel}
              onChange={(e) => setSelectedPersonnel(e.target.value)}
              disabled={personnelList.length === 0}
            >
              <option value="">
                {personnelList.length === 0
                  ? "No available personnel"
                  : "Select personnel..."}
              </option>
              {personnelList.map((p, i) => (
                <option key={i} value={p.pers_username}>
                  {p.pers_fname} {p.pers_lname}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            className="add-btn bg-success p-1 px-3 fw-normal border-0 rounded-2"
            onClick={handleAssignPersonnel}
          >
            Assign
          </Button>
        </Modal.Footer>
      </Modal>
    </OperationalLayout>
  );
};

export default OperationalDelivery;
