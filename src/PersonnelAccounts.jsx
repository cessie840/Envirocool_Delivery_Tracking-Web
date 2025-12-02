import React, { useEffect, useState } from "react";
import OperationalLayout from "./OperationalLayout";
import ViewPersonnelModal from "./ViewPersonnelModal";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUserPlus, FaCheck, FaTimes, FaFilter } from "react-icons/fa";
import { Table, Modal, Button, Form } from "react-bootstrap";
import { ToastHelper } from "./helpers/ToastHelper";
import { HiQuestionMarkCircle } from "react-icons/hi";

const PersonnelAccounts = () => {
  const [showFAQ, setShowFAQ] = useState(false);
  const [activeFAQIndex, setActiveFAQIndex] = useState(null);
  const [personnel, setPersonnel] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();

  // QBE state
  const [showQbeModal, setShowQbeModal] = useState(false);
  const [qbeName, setQbeName] = useState("");
  const [qbeEmail, setQbeEmail] = useState("");
  const [qbeUsername, setQbeUsername] = useState("");
  const [qbeStatus, setQbeStatus] = useState("");
  const [qbeAssignmentStatus, setQbeAssignmentStatus] = useState("");

  const guideqst = [
    {
      question: "How can I assign deliveries to delivery personnel?",
      answer:
        "Go to the 'Unassigned Orders' tab inside the Delivery Details page, then click the 'Assign Now' button. Within the transaction details, click the 'Assign Delivery Personnel' button to select and assign the designated delivery personnel and delivery truck for that transaction.",
    },
    {
      question:
        "How can I update the assigned delivery personnel in a transaction?",
      answer:
        "Navigate to the 'Assigned Orders' tab and click the 'View Details' button. Inside the transaction details, click the 'Change Personnel' button to update the assigned delivery personnel and/or delivery truck for that specific transaction.",
    },
    {
      question:
        "What happens if a delivery is assigned to the wrong personnel and the personnel has already left?",
      answer:
        "This situation is beyond the system’s control, as it requires direct communication with the delivery personnel involved since they are the account holder responsible for the delivery.",
    },
  ];

  useEffect(() => {
    document.title = "Delivery Personnel Accounts";
    fetchPersonnel();
  }, []);

  const fetchPersonnel = () => {
    axios
      .get(
        "http://localhost/DeliveryTrackingSystem/display_delivery_personnel.php"
      )
      .then((response) => {
        const dataWithStatus = response.data.map((p) => ({
          ...p,
          status: p.status || "Inactive",
          assignment_status: p.assignment_status || "Inactive",
        }));
        setPersonnel(dataWithStatus);
      })
      .catch((error) => console.error("Error fetching personnel:", error));
  };

  const contains = (hay, needle) =>
    String(hay || "")
      .toLowerCase()
      .includes(String(needle || "").toLowerCase());

  const hasQBE =
    qbeName.trim() ||
    qbeEmail.trim() ||
    qbeUsername.trim() ||
    qbeStatus.trim() ||
    qbeAssignmentStatus.trim();

  const filteredPersonnel = personnel.filter((person) => {
    const fullName = `${person.pers_fname || ""} ${person.pers_lname || ""}`;
    const email = person.pers_email || "";
    const username = person.pers_username || "";
    const status = person.status || "";
    const assignmentStatus = person.assignment_status || "";

    if (hasQBE) {
      if (qbeName && !contains(fullName, qbeName)) return false;
      if (qbeEmail && !contains(email, qbeEmail)) return false;
      if (qbeUsername && !contains(username, qbeUsername)) return false;
      if (qbeStatus && !contains(status, qbeStatus)) return false;
      if (
        qbeAssignmentStatus &&
        !contains(assignmentStatus, qbeAssignmentStatus)
      )
        return false;
      if (searchTerm) {
        const search = String(searchTerm).toLowerCase();
        return (
          fullName.toLowerCase().includes(search) ||
          email.toLowerCase().includes(search) ||
          username.toLowerCase().includes(search) ||
          status.toLowerCase().includes(search) ||
          assignmentStatus.toLowerCase().includes(search)
        );
      }
      return true;
    }

    const search = String(searchTerm).toLowerCase();
    return (
      fullName.toLowerCase().includes(search) ||
      email.toLowerCase().includes(search) ||
      username.toLowerCase().includes(search) ||
      status.toLowerCase().includes(search) ||
      assignmentStatus.toLowerCase().includes(search)
    );
  });

  const handleToggleStatus = (username, currentStatus, assignmentStatus) => {
    if (assignmentStatus === "Out for Delivery") {
      ToastHelper.error("Cannot set personnel to Inactive while on delivery.");
      return;
    }

    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    setPersonnel((prev) =>
      prev.map((p) =>
        p.pers_username === username
          ? {
              ...p,
              status: newStatus,
              assignment_status:
                newStatus === "Inactive"
                  ? "Inactive"
                  : p.assignment_status || "Available",
            }
          : p
      )
    );

    axios
      .post(
        "http://localhost/DeliveryTrackingSystem/update_personnel_status.php",
        { username, status: newStatus }
      )
      .then((res) => {
        if (res.data.success) {
          setPersonnel((prev) =>
            prev.map((p) =>
              p.pers_username === username
                ? {
                    ...p,
                    status: newStatus,
                    assignment_status:
                      newStatus === "Inactive"
                        ? "Inactive"
                        : res.data.assignment_status || "Available",
                  }
                : p
            )
          );
          ToastHelper.success(`${username} is now ${newStatus.toUpperCase()}.`);
        } else {
          ToastHelper.error(res.data.message);
          fetchPersonnel();
        }
      })
      .catch((err) => {
        console.error("Error updating status:", err);
        fetchPersonnel();
      });
  };

  const openQbeModal = () => setShowQbeModal(true);
  const closeQbeModal = () => setShowQbeModal(false);
  const clearQBE = () => {
    setQbeName("");
    setQbeEmail("");
    setQbeUsername("");
    setQbeStatus("");
    setQbeAssignmentStatus("");
  };
  const applyQBE = () => setShowQbeModal(false);

  return (
    <OperationalLayout
      title={
        <div className="d-flex align-items-center gap-2">
          <span>Delivery Personnel Accounts</span>
          <HiQuestionMarkCircle
            style={{ fontSize: "2rem", color: "#07720885", cursor: "pointer" }}
            onClick={() => setShowFAQ(true)}
          />
        </div>
      }
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
    >
      <div className="d-flex justify-content-end mx-4 my-5 align-items-center gap-2">
        <Button
          className="me-2 btn-view py-2 px-3 fs-6nrounded rounded-2"
          // variant="outline-primary"
          size="sm"
          onClick={() => setShowQbeModal(true)}
        >
          <FaFilter /> {"  "}
          Advanced Filter
        </Button>

        <button
          className="add-delivery rounded rounded-2 px-4 py-2 d-flex align-items-center gap-2"
          onClick={() => navigate("/create-personnel-account-ops")}
        >
          <FaUserPlus /> Create Account
        </button>
      </div>

      <Table
        bordered
        hover
        responsive
        className="delivery-table container-fluid table-responsive bg-white"
      >
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Email</th>
            <th>Username</th>
            <th>Status</th>
            <th>Active</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody className="p-2">
          {filteredPersonnel.length > 0 ? (
            [...filteredPersonnel]
              .sort((a, b) => {
                if (a.status === "Active" && b.status === "Inactive") return -1;
                if (a.status === "Inactive" && b.status === "Active") return 1;
                return 0;
              })
              .map((person) => (
                <tr key={person.pers_username}>
                  <td>
                    {person.pers_fname} {person.pers_lname}
                  </td>
                  <td>{person.pers_email}</td>
                  <td>{person.pers_username}</td>
                  <td
                    className={`text-center fw-bold ${
                      person.assignment_status?.trim().toLowerCase() ===
                      "available"
                        ? "text-success"
                        : "text-danger"
                    }`}
                  >
                    {person.assignment_status?.trim().toLowerCase() ===
                    "out for delivery"
                      ? "On Delivery"
                      : person.assignment_status}
                  </td>
                  <td className="text-center">
                    <div className="d-flex flex-column align-items-center">
                      <div
                        onClick={() =>
                          handleToggleStatus(
                            person.pers_username,
                            person.status,
                            person.assignment_status
                          )
                        }
                        style={{
                          cursor:
                            person.assignment_status?.trim().toLowerCase() ===
                            "out for delivery"
                              ? "not-allowed"
                              : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent:
                            person.status === "Active"
                              ? "flex-end"
                              : "flex-start",
                          width: "60px",
                          height: "28px",
                          borderRadius: "20px",
                          backgroundColor:
                            person.status === "Active" ? "green" : "red",
                          padding: "0 6px",
                          opacity:
                            person.assignment_status?.trim().toLowerCase() ===
                            "out for delivery"
                              ? 0.5
                              : 1,
                          transition: "all 0.3s ease",
                        }}
                      >
                        <span
                          style={{
                            background: "white",
                            borderRadius: "50%",
                            width: "22px",
                            height: "22px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            color: person.status === "Active" ? "green" : "red",
                            fontWeight: "bold",
                            transition: "all 0.3s ease",
                          }}
                        >
                          {person.status === "Active" ? (
                            <FaCheck />
                          ) : (
                            <FaTimes />
                          )}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="action-btn p-2 d-flex gap-2 align-items-center justify-content-center">
                    <button
                      id="personnel-view"
                      className="btn btn-view"
                      onClick={() => {
                        setSelectedUser(person.pers_username);
                        setShowModal(true);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center">
                {searchTerm || hasQBE
                  ? "No matching personnel found."
                  : "No delivery personnel accounts found."}
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      <ViewPersonnelModal
        show={showModal}
        onHide={() => setShowModal(false)}
        username={selectedUser}
      />

      {/* QBE Modal */}
      <Modal show={showQbeModal} onHide={closeQbeModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Advanced Filter (QBE)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Full name or part"
              value={qbeName}
              onChange={(e) => setQbeName(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="text"
              placeholder="Email or part"
              value={qbeEmail}
              onChange={(e) => setQbeEmail(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              placeholder="Username or part"
              value={qbeUsername}
              onChange={(e) => setQbeUsername(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Status</Form.Label>
            <Form.Control
              as="select"
              value={qbeStatus}
              onChange={(e) => setQbeStatus(e.target.value)}
            >
              <option value="">(Any)</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </Form.Control>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Assignment Status</Form.Label>
            <Form.Control
              as="select"
              value={qbeAssignmentStatus}
              onChange={(e) => setQbeAssignmentStatus(e.target.value)}
            >
              <option value="">(Any)</option>
              <option value="Available">Available</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Inactive">Inactive</option>
            </Form.Control>
            <Form.Text className="text-muted">
              Fill any combination of fields. Filters are combined with AND
              logic.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeQbeModal}>
            Cancel
          </Button>
          <Button
            variant="light"
            onClick={() => {
              clearQBE();
            }}
          >
            Clear
          </Button>
          <Button variant="primary" onClick={applyQBE}>
            Apply
          </Button>
        </Modal.Footer>
      </Modal>

      {/* FAQ Modal */}
      <Modal
        show={showFAQ}
        onHide={() => {
          setShowFAQ(false);
          setActiveFAQIndex(null);
        }}
        centered
        dialogClassName="faq-modal-dialog"
      >
        <Modal.Header
          closeButton
          style={{
            backgroundColor: "#116B8A",
            color: "white",
            borderBottom: "none",
          }}
        >
          <Modal.Title>Guide for Delivery Personnel Accounts</Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ backgroundColor: "#f8f9fa" }}>
          <p className="px-3 text-justify mb-4" style={{ color: "#333" }}>
            The Delivery Personnel Accounts page allows you to manage all
            registered delivery personnel within the system...
          </p>

          <div className="px-3 mb-3">
            <div className="accordion" id="faqAccordion">
              {guideqst.map((faq, index) => (
                <div
                  className="accordion-item mb-3 shadow-sm border-0"
                  key={index}
                >
                  <h2 className="accordion-header" id={`heading${index}`}>
                    <button
                      className={`accordion-button ${
                        activeFAQIndex === index ? "" : "collapsed"
                      }`}
                      type="button"
                      onClick={() =>
                        setActiveFAQIndex(
                          activeFAQIndex === index ? null : index
                        )
                      }
                      aria-expanded={activeFAQIndex === index}
                      aria-controls={`collapse${index}`}
                      style={{
                        backgroundColor:
                          activeFAQIndex === index ? "#116B8A" : "#e9f6f8",
                        color: activeFAQIndex === index ? "white" : "#116B8A",
                        fontWeight: 600,
                        transition: "all 0.3s ease",
                      }}
                    >
                      {faq.question}
                    </button>
                  </h2>
                  <div
                    id={`collapse${index}`}
                    className={`accordion-collapse collapse ${
                      activeFAQIndex === index ? "show" : ""
                    }`}
                    aria-labelledby={`heading${index}`}
                    data-bs-parent="#faqAccordion"
                  >
                    <div
                      className="accordion-body bg-white rounded-bottom"
                      style={{
                        borderLeft: "4px solid #116B8A",
                        color: "#333",
                        fontSize: "0.95rem",
                      }}
                    >
                      <strong>Answer:</strong> {faq.answer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer
          style={{ backgroundColor: "#f8f9fa", borderTop: "1px solid #dee2e6" }}
        >
          <Button
            onClick={() => {
              setShowFAQ(false);
              setActiveFAQIndex(null);
            }}
            className="close-btn px-4 py-2 fs-6 rounded-2"
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </OperationalLayout>
  );
};

export default PersonnelAccounts;
