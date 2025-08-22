import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Tabs, Tab } from "react-bootstrap";
import OperationalLayout from "./OperationalLayout";
import axios from "axios";
import { BsExclamationCircleFill, BsCheckCircleFill } from "react-icons/bs";

const OperationalDelivery = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [personnelList, setPersonnelList] = useState([]);
  const [activeTab, setActiveTab] = useState("unassigned");

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
      if (res.data.success && Array.isArray(res.data.data)) {
        setPersonnelList(res.data.data);
      } else {
        setPersonnelList([]);
      }
    } catch (error) {
      console.error("Failed to fetch personnel:", error);
      setPersonnelList([]);
    }
  };

  const handleOpenAssignModal = () => {
    setSelectedPersonnel("");
    setShowModal(true);
  };

  const handleAssignPersonnel = async () => {
    if (!selectedPersonnel) {
      alert("Please select a delivery personnel.");
      return;
    }

    if (selectedOrder?.assigned_personnel) {
      const confirmReassign = window.confirm(
        `This order is already assigned to ${selectedOrder.assigned_personnel}. Do you want to reassign it?`
      );
      if (!confirmReassign) return;
    }

    try {
      const res = await axios.post(
        "http://localhost/DeliveryTrackingSystem/assign_personnel.php",
        {
          transaction_id: selectedOrder.transaction_id,
          personnelUsername: selectedPersonnel,
        }
      );

      if (res.data.success) {
        alert("Personnel assigned successfully!");
        setShowModal(false);
        setShowDetailModal(false);
        setSelectedOrder(null);
        fetchOrders();
      } else {
        alert("Assignment failed: " + (res.data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Assignment failed:", error);
      alert("Assignment failed. Please try again later.");
    }
  };

  const openDetailModal = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const unassignedOrders = orders.filter(
    (o) => !o.assigned_personnel || o.assigned_personnel === null
  );
  const assignedOrders = orders.filter(
    (o) => o.assigned_personnel && o.assigned_personnel !== null
  );

  return (
    <OperationalLayout title="Delivery Orders">
      <div className="compact-container container mt-5 pb-5 px-5 rounded-2">
        <Tabs
          id="delivery-tabs"
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-4 fw-bold"
        >
          {/* Unassigned Tab */}
          <Tab
            eventKey="unassigned"
            title={
              <span className="d-flex align-items-center text-danger">
                <BsExclamationCircleFill className="me-2" /> Unassigned Orders
              </span>
            }
          >
            <div className="row">
              {unassignedOrders.length === 0 ? (
                <div className="col-12 text-center text-muted my-3">
                  <h6>All orders are already assigned </h6>
                </div>
              ) : (
                unassignedOrders.map((order, index) => (
                  <div key={index} className="col-md-6">
                    <div className="compact-card card shadow-sm rounded-2 p-3 m-2 border border-danger">
                      <h5 className="fw-bold text-danger">
                        Transaction No. {order.transaction_id}
                      </h5>
                      <p className="mb-2">
                        <strong>Customer:</strong> {order.customer_name}
                      </p>
                      <p className="mb-2 text-muted">
                        <strong>Delivery Personnel:</strong> Not Assigned
                      </p>
                      <div className="text-end">
                        <Button
                          className="btn-view"
                          size="sm"
                          variant="danger"
                          onClick={() => openDetailModal(order)}
                        >
                          Assign Now
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Tab>

          {/* Assigned Tab */}
          <Tab
            eventKey="assigned"
            title={
              <span className="d-flex align-items-center text-success">
                <BsCheckCircleFill className="me-2" /> Assigned Orders
              </span>
            }
          >
            <div className="row">
              {assignedOrders.length === 0 ? (
                <div className="col-12 text-center text-muted my-3">
                  <h6>No orders have been assigned yet.</h6>
                </div>
              ) : (
                assignedOrders.map((order, index) => (
                  <div key={index} className="col-md-6">
                    <div className="compact-card card shadow-sm rounded-2 p-3 m-2 border border-success">
                      <h5 className="fw-bold text-success">
                        Transaction No. {order.transaction_id}
                      </h5>
                      <p className="mb-2">
                        <strong>Customer:</strong> {order.customer_name}
                      </p>
                      <p className="mb-2">
                        <strong>Delivery Personnel:</strong>{" "}
                        <span className="text-success fw-bold">
                          {order.assigned_personnel}
                        </span>
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
          </Tab>
        </Tabs>
      </div>

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
              Transaction #{selectedOrder.transaction_id}
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

            {selectedOrder.assigned_personnel ? (
              <div className="p-3 mt-3 bg-light border rounded-3">
                <ul className="list-group">
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <span className="fw-bold text-success">
                      Delivery Personnel Assigned:
                    </span>
                    <b>{selectedOrder.assigned_personnel}</b>
                  </li>
                </ul>
                <div className="text-center mt-3">
                  <Button
                    variant="warning"
                    className="btn-view"
                    onClick={handleOpenAssignModal}
                  >
                    Change Personnel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center mt-4">
                <Button
                  variant="success"
                  className="btn-view"
                  onClick={handleOpenAssignModal}
                >
                  Assign Delivery Personnel
                </Button>
              </div>
            )}
          </Modal.Body>
        </Modal>
      )}

      {/* Assign Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-success">
            {selectedOrder?.assigned_personnel
              ? "Reassign Personnel"
              : "Assign Delivery Personnel"}
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
            className={`add-btn p-1 px-3 fw-normal border-0 rounded-2 ${
              selectedOrder?.assigned_personnel ? "btn-warning" : "bg-success"
            }`}
            onClick={handleAssignPersonnel}
          >
            {selectedOrder?.assigned_personnel ? "Reassign" : "Assign"}
          </Button>
        </Modal.Footer>
      </Modal>
    </OperationalLayout>
  );
};

export default OperationalDelivery;
