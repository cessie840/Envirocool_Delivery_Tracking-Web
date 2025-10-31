import React, { useEffect, useState } from "react";
import OperationalLayout from "./OperationalLayout";
import ViewPersonnelModal from "./ViewPersonnelModal";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUserPlus, FaCheck, FaTimes } from "react-icons/fa";
import { Table, Modal, Button } from "react-bootstrap";
import { ToastHelper } from "./helpers/ToastHelper";
import { HiQuestionMarkCircle } from "react-icons/hi";

const PersonnelAccounts = () => {
  const [showFAQ, setShowFAQ] = useState(false);
  const [activeFAQIndex, setActiveFAQIndex] = useState(null);

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
  const navigate = useNavigate();
  const [personnel, setPersonnel] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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
      .catch((error) => {
        console.error("Error fetching personnel:", error);
      });
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
        {
          username,
          status: newStatus,
        }
      )
      .then((response) => {
        if (response.data.success) {
          setPersonnel((prev) =>
            prev.map((p) =>
              p.pers_username === username
                ? {
                    ...p,
                    status: newStatus,
                    assignment_status:
                      newStatus === "Inactive"
                        ? "Inactive"
                        : response.data.assignment_status || "Available",
                  }
                : p
            )
          );

          ToastHelper.success(
            `${username} is now ${
              newStatus === "Active" ? "ACTIVE" : "INACTIVE"
            }.`
          );
        } else {
          ToastHelper.error(response.data.message);
          fetchPersonnel();
        }
      })
      .catch((error) => {
        console.error("Error updating status:", error);
      });
  };

  return (
    <OperationalLayout
      title={
        <div className="d-flex align-items-center gap-2">
          <span>Delivery Personnel Accounts</span>
          <HiQuestionMarkCircle
            style={{
              fontSize: "2rem",
              color: "#07720885",
              cursor: "pointer",
              marginLeft: "10px",
            }}
            onClick={() => setShowFAQ(true)}
          />
        </div>
      }
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
    >
      <div className="d-flex justify-content-end mx-4 my-5">
        <button
          className="add-delivery rounded-3 px-4 py-2 d-flex align-items-center gap-2"
          onClick={() => navigate("/create-personnel-account")}
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
                        : person.assignment_status?.trim().toLowerCase() ===
                          "out for delivery"
                        ? "text-danger"
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
                        onClick={() => {
                          if (
                            person.assignment_status?.trim().toLowerCase() ===
                            "out for delivery"
                          ) {
                            ToastHelper.error(
                              "Cannot change the account status while personnel is on delivery."
                            );
                            return;
                          }
                          handleToggleStatus(
                            person.pers_username,
                            person.status,
                            person.assignment_status
                          );
                        }}
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
                {searchTerm
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
            registered delivery personnel within the system. You can view their
            account details, email addresses, assigned usernames, and current
            availability status. From this page, you can also create new
            accounts for delivery personnel or view existing profiles to ensure
            that all delivery staff information is accurate and up to date.
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
                      onMouseOver={(e) => {
                        if (activeFAQIndex !== index) {
                          e.currentTarget.style.backgroundColor = "#d9eff1";
                        }
                      }}
                      onMouseOut={(e) => {
                        if (activeFAQIndex !== index) {
                          e.currentTarget.style.backgroundColor = "#e9f6f8";
                        }
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
          style={{
            backgroundColor: "#f8f9fa",
            borderTop: "1px solid #dee2e6",
          }}
        >
          <Button
            variant="outline-secondary"
            onClick={() => {
              setShowFAQ(false);
              setActiveFAQIndex(null);
            }}
            className="px-4"
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </OperationalLayout>
  );
};

export default PersonnelAccounts;
