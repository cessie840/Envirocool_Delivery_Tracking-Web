import React, { useState } from "react";
import { Navbar, Form, InputGroup, Modal, Button } from "react-bootstrap";
import logo from "./assets/envirocool-logo.png";

const HeaderAndNav = ({ onSidebarToggle }) => {
  const [showNotif, setShowNotif] = useState(false);

  const sampleNotifications = [
    "MEMA LANG TO PEDE IREMOVE PAG DI NATIN KAYA",
    "You have 3 new deliveries assigned.",
    "Reminder: Update your profile information.",
  ];

  return (
    <>
      {/* HEADER */}
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
              <Form.Control size="sm" placeholder="Search" />
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
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i
                className="bi bi-bell-fill"
                style={{ color: "#116B8A", fontSize: "1.2rem" }}
              ></i>
            </Button>
          </div>
        </div>

        {/* NAVBAR */}
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

      {/* NOTIFICATION MODAL*/}
      <Modal show={showNotif} onHide={() => setShowNotif(false)} centered>
        <Modal.Header closeButton style={{ backgroundColor: "#E8F8F5" }}>
          <Modal.Title>Notifications</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: "#F2FDF4" }}>
          {sampleNotifications.length > 0 ? (
            <ul className="list-unstyled">
              {sampleNotifications.map((notif, i) => (
                <li key={i} className="mb-2">
                  <i className="bi bi-dot text-success me-2"></i>
                  {notif}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">No new notifications.</p>
          )}
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: "#E8F8F5" }}>
          <Button variant="secondary" onClick={() => setShowNotif(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default HeaderAndNav;
