import React, { useState } from "react";
import { Accordion, Card, Container } from "react-bootstrap";
import Sidebar from "./DriverSidebar";
import HeaderAndNav from "./DriverHeaderAndNav";

const DriverGuidePage = () => {
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <div style={{ backgroundColor: "#f0f4f7", minHeight: "100vh" }}>
      <HeaderAndNav onSidebarToggle={() => setShowSidebar(true)} />
      <Sidebar show={showSidebar} onHide={() => setShowSidebar(false)} />

      <Container className="my-4">
        <Card
          className="shadow-lg border-0 rounded-4 mx-auto"
          style={{
            backgroundColor: "#eaf7f7",
            maxWidth: "900px",
          }}
        >
          <Card.Header
            className="d-flex align-items-center gap-2 text-white rounded-top-4"
            style={{
              backgroundColor: "#116B8A",
              padding: "1rem 1.5rem",
            }}
          >
            <h4 className="mb-0 fw-semibold">Guide for Delivery Personnel</h4>
          </Card.Header>

          <Card.Body className="px-4 py-4">
            <p className="text-secondary mb-4">
              Welcome to the{" "}
              <strong>Envirocool Delivery Personnel Guide</strong>. This page
              provides essential instructions to help delivery personnel
              navigate the system — from managing profiles to completing
              deliveries efficiently.
            </p>

            <Accordion alwaysOpen flush>
              <Accordion.Item
                eventKey="0"
                className="border mb-3 rounded-3 shadow-sm"
              >
                <Accordion.Header>How can I edit my profile?</Accordion.Header>
                <Accordion.Body>
                  Go to <strong>Profile Settings</strong> in the sidebar. You
                  can update your name, email, phone number, and profile
                  picture. After making changes, click <strong>Save</strong> to
                  confirm updates.
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item
                eventKey="1"
                className="border mb-3 rounded-3 shadow-sm"
              >
                <Accordion.Header>
                  How can I check my assigned deliveries?
                </Accordion.Header>
                <Accordion.Body>
                  Navigate to <strong>Assigned Deliveries</strong> to view all
                  transactions assigned to you. Click <strong>View</strong>{" "}
                  beside each record to see customer details, address, and order
                  items.
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item
                eventKey="2"
                className="border mb-3 rounded-3 shadow-sm"
              >
                <Accordion.Header>
                  What should I do when I start a delivery?
                </Accordion.Header>
                <Accordion.Body>
                  Once ready to depart, open your assigned delivery and click{" "}
                  <strong>Mark as Out for Delivery</strong>. The system will
                  notify the admin that the delivery is in progress.
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item
                eventKey="3"
                className="border mb-3 rounded-3 shadow-sm"
              >
                <Accordion.Header>
                  How do I mark a delivery as completed?
                </Accordion.Header>
                <Accordion.Body>
                  After successfully completing the delivery, click{" "}
                  <strong>Mark as Delivered</strong>. The delivery will
                  automatically move to the{" "}
                  <strong>Successful Deliveries</strong> tab.
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item
                eventKey="4"
                className="border mb-3 rounded-3 shadow-sm"
              >
                <Accordion.Header>
                  What if the delivery fails or is cancelled?
                </Accordion.Header>
                <Accordion.Body>
                  If a delivery cannot be completed, click{" "}
                  <strong>Cancel Delivery</strong> and select a reason. The
                  order will move to <strong>Failed Deliveries</strong> for
                  admin review or rescheduling.
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item
                eventKey="5"
                className="border mb-3 rounded-3 shadow-sm"
              >
                <Accordion.Header>
                  How can I log out from my account?
                </Accordion.Header>
                <Accordion.Body>
                  Open the sidebar and click <strong>Logout</strong>. Confirm
                  the prompt to securely exit your session.
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default DriverGuidePage;
