import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import ViewPersonnelModal from "./ViewPersonnelModal";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUserPlus, FaCheck, FaTimes } from "react-icons/fa";
import { Table, Modal, Button } from "react-bootstrap";
import { ToastHelper } from "./helpers/ToastHelper";
import { HiQuestionMarkCircle } from "react-icons/hi";

const UserManagement = () => {
  const [showFAQ, setShowFAQ] = useState(false);
  const [activeFAQIndex, setActiveFAQIndex] = useState(null);
  const [personnel, setPersonnel] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();

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
    document.title = "User Management";
    fetchPersonnel();
  }, []);

  const fetchPersonnel = () => {
    axios
      .get(
        "http://localhost/DeliveryTrackingSystem/display_delivery_personnel.php"
      )
      .then((res) => {
        const dataWithStatus = res.data.map((p) => ({
          ...p,
          status: p.status || "Inactive",
          assignment_status: p.assignment_status || "Inactive",
        }));
        setPersonnel(dataWithStatus);
      })
      .catch((err) => console.error("Error fetching personnel:", err));
  };

  const filteredPersonnel = personnel.filter((person) => {
    const fullName = `${person.pers_fname || ""} ${
      person.pers_lname || ""
    }`.toLowerCase();
    const email = (person.pers_email || "").toLowerCase();
    const username = (person.pers_username || "").toLowerCase();
    const status = (person.status || "").toLowerCase();
    const assignmentStatus = (person.assignment_status || "").toLowerCase();
    const search = searchTerm.toLowerCase();

    return (
      fullName.includes(search) ||
      email.includes(search) ||
      username.includes(search) ||
      status.includes(search) ||
      assignmentStatus.includes(search)
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
      .catch((err) => console.error("Error updating status:", err));
  };

  return (
    <AdminLayout
      title={
        <div className="d-flex align-items-center gap-2">
          <span>User Management</span>
          <HiQuestionMarkCircle
            style={{ fontSize: "2rem", color: "#07720885", cursor: "pointer" }}
            onClick={() => setShowFAQ(true)}
          />
        </div>
      }
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
    >
      {/* Create Account Button */}
      <div className="d-flex justify-content-end mx-4 my-4">
        <Button
          variant="success"
          className="d-flex align-items-center gap-2"
          onClick={() => navigate("/create-personnel-account")}
        >
          <FaUserPlus /> Create Account
        </Button>
      </div>

      {/* Personnel Table */}
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
        <tbody>
          {filteredPersonnel.length > 0 ? (
            [...filteredPersonnel]
              .sort((a, b) => (a.status === "Active" ? -1 : 1))
              .map((person) => (
                <tr key={person.pers_username}>
                  <td>
                    {person.pers_fname} {person.pers_lname}
                  </td>
                  <td>{person.pers_email}</td>
                  <td>{person.pers_username}</td>
                  <td
                    className={`text-center fw-bold ${
                      person.assignment_status?.toLowerCase() === "available"
                        ? "text-success"
                        : "text-danger"
                    }`}
                  >
                    {person.assignment_status === "Out for Delivery"
                      ? "On Delivery"
                      : person.assignment_status}
                  </td>
                  <td className="text-center">
                    {/* Toggle below status */}
                    <div className="d-flex flex-column align-items-center gap-2">
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
                            person.assignment_status === "Out for Delivery"
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
                            person.assignment_status === "Out for Delivery"
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
                  <td className="text-center">
                    <Button
                      variant="primary"
                      onClick={() => {
                        setSelectedUser(person.pers_username);
                        setShowModal(true);
                      }}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center">
                {searchTerm
                  ? "No matching personnel found."
                  : "No delivery personnel accounts found."}
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* View Modal */}
      <ViewPersonnelModal
        show={showModal}
        onHide={() => setShowModal(false)}
        username={selectedUser}
      />

      {/* FAQ Modal */}
      <Modal show={showFAQ} onHide={() => setShowFAQ(false)} centered>
        <Modal.Header
          closeButton
          style={{
            backgroundColor: "#116B8A",
            color: "white",
            borderBottom: "none",
          }}
        >
          <Modal.Title>User Management Guide</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: "#f8f9fa" }}>
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
                      setActiveFAQIndex(activeFAQIndex === index ? null : index)
                    }
                    aria-expanded={activeFAQIndex === index}
                    aria-controls={`collapse${index}`}
                    style={{
                      backgroundColor:
                        activeFAQIndex === index ? "#116B8A" : "#e9f6f8",
                      color: activeFAQIndex === index ? "white" : "#116B8A",
                      fontWeight: 600,
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
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: "#f8f9fa" }}>
          <Button
            onClick={() => {
              setShowFAQ(false);
              setActiveFAQIndex(null);
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </AdminLayout>
  );
};

export default UserManagement;
