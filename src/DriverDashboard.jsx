import React, { useState, useEffect } from "react";
import { Button, Container, Card, Modal } from "react-bootstrap";
import axios from "axios";
import Sidebar from "./DriverSidebar";
import HeaderAndNav from "./DriverHeaderAndNav";
import { useNavigate, useLocation } from "react-router-dom";

function DriverDashboard() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [assignedDeliveries, setAssignedDeliveries] = useState([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [outForDelivery, setOutForDelivery] = useState([]);
  const [newDeliveriesCount, setNewDeliveriesCount] = useState(0);
  const [showNewDeliveryPopup, setShowNewDeliveryPopup] = useState(false);
  const [newDeliveries, setNewDeliveries] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const [highlightedTxn, setHighlightedTxn] = useState(null);

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
        "http:/localhost/DeliveryTrackingSystem/fetch_personnel_deliveries.php",
        { pers_username: username }
      )
      .then((res) => {
        if (!Array.isArray(res.data)) return;

        const assigned = res.data.filter(
          (d) =>
            d.delivery_status === "To Ship" || d.delivery_status === "Pending"
        );
        const out = res.data.filter(
          (d) => d.delivery_status === "Out for Delivery"
        );

        setAssignedDeliveries(assigned);
        setFilteredDeliveries(assigned);
        setOutForDelivery(out);

        const notifKey = `notifications_${username}`;
        let storedNotifs = JSON.parse(localStorage.getItem(notifKey)) || [];
        const storedTxnNos = new Set(storedNotifs.map((n) => n.transactionNo));

        const freshOnes = assigned.filter(
          (d) => !storedTxnNos.has(d.transactionNo)
        );

        if (freshOnes.length > 0) {
          setNewDeliveries(freshOnes);
          setNewDeliveriesCount(freshOnes.length);
          setShowNewDeliveryPopup(true);

        
          const newNotifs = freshOnes.map((d) => ({
            transactionNo: d.transactionNo,
            message: `You have a new assigned delivery for Transaction No. ${d.transactionNo}`,
            read: false,
            timestamp: Date.now(),
          }));

          const updatedNotifs = [...storedNotifs, ...newNotifs];
          const uniqueNotifs = Array.from(
            new Map(updatedNotifs.map((n) => [n.transactionNo, n])).values()
          );

          localStorage.setItem(notifKey, JSON.stringify(uniqueNotifs));
        }
      })
      .catch((err) => console.error("Error fetching deliveries:", err));
  };

 
  useEffect(() => {
    fetchAssignedDeliveries();
    const interval = setInterval(fetchAssignedDeliveries, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (location.state?.scrollTo) {
      const txnNo = location.state.scrollTo;
      const element = document.getElementById(`transaction-${txnNo}`);
      if (element) {
        const yOffset = -150;
        const y =
          element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });

        setHighlightedTxn(txnNo);
        const timer = setTimeout(() => setHighlightedTxn(null), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [location.state]);

  const handleClosePopup = () => {
    setShowNewDeliveryPopup(false);
    setNewDeliveries([]);
    setNewDeliveriesCount(0);
  };

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
        "http:/localhost/DeliveryTrackingSystem/update_out_of_order_status.php",
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
        console.error("API error:", err);
        alert("Failed to update delivery status. Please try again later.");
      });
  };

  const handleSearch = (term) => {
    if (!term) {
      setFilteredDeliveries(assignedDeliveries);
      return;
    }

    const filtered = assignedDeliveries.filter((delivery) => {
      const txnMatch = delivery.transactionNo
        .toString()
        .toLowerCase()
        .includes(term.toLowerCase());
      const nameMatch = delivery.customerName
        .toLowerCase()
        .includes(term.toLowerCase());
      return txnMatch || nameMatch;
    });

    setFilteredDeliveries(filtered);
  };

  return (
    <div style={{ backgroundColor: "#f0f4f7", minHeight: "100vh" }}>
      <HeaderAndNav
        onSidebarToggle={() => setShowSidebar(true)}
        newDeliveries={newDeliveries}
        onSearch={handleSearch}
      />
      <Sidebar show={showSidebar} onHide={() => setShowSidebar(false)} />

      <Modal show={showNewDeliveryPopup} onHide={handleClosePopup} centered>
        <Modal.Header closeButton>
          <Modal.Title>New Assigned Deliveries</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {newDeliveriesCount === 1
            ? "You have 1 new assigned delivery."
            : `You have ${newDeliveriesCount} new assigned deliveries.`}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="success" onClick={handleClosePopup}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <Container className="py-4">
        <br />
        <h2 className="text-center text-success fw-bold mb-3">
          ASSIGNED DELIVERIES
        </h2>
        <br />

        {filteredDeliveries.length === 0 ? (
          <p className="text-muted text-center">No Assigned Deliveries.</p>
        ) : (
          filteredDeliveries.map((delivery, idx) => (
            <Card
              key={idx}
              id={`transaction-${delivery.transactionNo}`}
              className="mb-4 p-3 border border-info rounded"
              style={{
                backgroundColor:
                  highlightedTxn === delivery.transactionNo
                    ? "#90cda6ff"
                    : "#eaf7f7",
                transition: "background-color 0.5s ease",
              }}
            >
              <h5 className="text-center fw-bold text-dark mb-3">
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
                      <span>{formatCurrency(item.qty * item.unitCost)}</span>
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
