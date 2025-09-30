import React, { useState, useEffect } from "react";
import {
  Navbar,
  Form,
  InputGroup,
  Modal,
  Button,
  Badge,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import logo from "./assets/envirocool-logo.png";

const HeaderAndNav = ({ onSidebarToggle, newDeliveries = [], onSearch }) => {
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  const getNotifKey = () => {
    const storedProfile = JSON.parse(localStorage.getItem("user"));
    if (!storedProfile || !storedProfile.pers_username) return null;
    return `notifications_${storedProfile.pers_username}`;
  };

  useEffect(() => {
    const storedProfile = JSON.parse(localStorage.getItem("user"));
    const username = storedProfile?.pers_username;

    if (!username) {
      setNotifications([]);
      return;
    }

    const notifKey = `notifications_${username}`;
    const storedNotifs = JSON.parse(localStorage.getItem(notifKey)) || [];

    if (storedNotifs.length === 0) {
      setNotifications([]);
    } else {
      setNotifications(storedNotifs);
    }
  }, [localStorage.getItem("user")]);

  useEffect(() => {
    if (newDeliveries.length === 0) return;
    const notifKey = getNotifKey();
    if (!notifKey) return;

    setNotifications((prev) => {
      const notifMap = new Map(prev.map((n) => [n.transactionNo, n]));
      let updated = [...prev];

      newDeliveries.forEach((delivery) => {
        if (!notifMap.has(delivery.transactionNo)) {
          const newNotif = {
            transactionNo: delivery.transactionNo,
            message: `You have new assigned deliveries for Transaction No. ${delivery.transactionNo}`,
            read: false,
            timestamp: Date.now(),
          };
          updated = [newNotif, ...updated];
          notifMap.set(delivery.transactionNo, newNotif);
        } else {
          const existing = notifMap.get(delivery.transactionNo);
          existing.message = `You have new assigned deliveries for Transaction No. ${delivery.transactionNo}`;
        }
      });

      localStorage.setItem(notifKey, JSON.stringify(updated));
      return updated;
    });
  }, [newDeliveries]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (transactionNo) => {
    const notifKey = getNotifKey();
    if (!notifKey) return;

    setNotifications((prev) => {
      const updated = prev.map((n) =>
        n.transactionNo === transactionNo ? { ...n, read: true } : n
      );
      localStorage.setItem(notifKey, JSON.stringify(updated));
      return updated;
    });

    setShowNotif(false);
    navigate("/driver-dashboard", { state: { scrollTo: transactionNo } });
  };

  return (
    <>
      {/* Header */}
      <div
        style={{
          position: "fixed",
          top: 0,
          width: "100%",
          zIndex: 1050,
          backgroundColor: "white",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <div className="d-flex justify-content-between align-items-center px-3 py-2">
          <img src={logo} alt="Logo" height="50" />

          <div className="d-flex align-items-center gap-2">
            <InputGroup style={{ maxWidth: "180px" }}>
              <Form.Control
                size="sm"
                placeholder="Search"
                onChange={(e) => onSearch && onSearch(e.target.value)}
              />
              <InputGroup.Text className="bg-white border-start-0">
                <i className="bi bi-search"></i>
              </InputGroup.Text>
            </InputGroup>

            <Button
              variant="light"
              onClick={() => setShowNotif(true)}
              style={{
                border: "1px solid #ccc",
                borderRadius: "50%",
                width: "38px",
                height: "38px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <i
                className="bi bi-bell-fill"
                style={{ color: "#116B8A", fontSize: "1.2rem" }}
              ></i>
              {unreadCount > 0 && (
                <Badge
                  pill
                  bg="danger"
                  style={{ position: "absolute", top: 0, right: 0 }}
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        <Navbar style={{ backgroundColor: "#116B8A" }} variant="dark">
          <Navbar.Brand
            className="ms-2 text-white"
            onClick={onSidebarToggle}
            style={{ cursor: "pointer" }}
          >
            <i className="bi bi-list fs-4"></i>
          </Navbar.Brand>
        </Navbar>
      </div>

      <div style={{ height: "112px" }}></div>

      {/* Notifications Modal */}
      <Modal show={showNotif} onHide={() => setShowNotif(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Notifications</Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            backgroundColor: "#F2FDF4",
            paddingRight: "25px",
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          {notifications.length > 0 ? (
            <>
              {notifications.some((n) => !n.read) && (
                <>
                  <h6 className="fw-bold text-success">New Notifications</h6>
                  <ul className="list-unstyled">
                    {notifications
                      .filter((n) => !n.read)
                      .map((notif) => (
                        <li
                          key={notif.transactionNo}
                          className="mb-2 d-flex align-items-center"
                          style={{
                            cursor: "pointer",
                            padding: "8px 10px",
                            borderRadius: "6px",
                            backgroundColor: "#E6F9ED",
                          }}
                          onClick={() =>
                            handleNotificationClick(notif.transactionNo)
                          }
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "#d4f5df")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = "#E6F9ED")
                          }
                        >
                          <i className="bi bi-dot text-success me-2"></i>
                          {notif.message}
                        </li>
                      ))}
                  </ul>
                </>
              )}

              {notifications.some((n) => n.read) && (
                <>
                  <h6 className="fw-bold text-muted mt-3">
                    Previous Notifications
                  </h6>
                  <ul className="list-unstyled">
                    {notifications
                      .filter((n) => n.read)
                      .map((notif) => (
                        <li
                          key={notif.transactionNo}
                          className="mb-2 d-flex align-items-center"
                          style={{
                            cursor: "pointer",
                            padding: "8px 10px",
                            borderRadius: "6px",
                          }}
                          onClick={() =>
                            handleNotificationClick(notif.transactionNo)
                          }
                        >
                          <i className="bi bi-dot text-secondary me-2"></i>
                          {notif.message}
                        </li>
                      ))}
                  </ul>
                </>
              )}
            </>
          ) : (
            <p className="text-muted">No notifications.</p>
          )}
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: "#E8F8F5" }}>
          <Button variant="success" onClick={() => setShowNotif(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default HeaderAndNav;
