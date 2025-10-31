import React, { useState, useEffect } from "react";
import OperationalLayout from "../OperationalLayout";
import EditProfileTab from "./EditProfileTab";
import ChangePasswordTab from "./ChangePasswordTab";
import ViewTermsTab from "./ViewTermsTab";
import "./settings.css";
import { HiQuestionMarkCircle } from "react-icons/hi";
import { Button, Modal } from "react-bootstrap";

const OperationalSettings = () => {
  const [showFAQ, setShowFAQ] = useState(false);
  const [activeFAQIndex, setActiveFAQIndex] = useState(null);

  const guideqst = [
    {
      question: "How can I edit my profile?",
      answer:
        "Click the 'Edit Profile' tab to display your current account details. Then, click the 'Edit' button to enable the input fields where you can update your credentials, such as Username, First Name, Last Name, Email, and Phone. After making your changes, click 'Save' and confirm to apply your updates.",
    },
    {
      question: "How can I change my password?",
      answer:
        "Go to the 'Change Password' tab to open the password settings. Enter your current password, then your new password, and confirm the new password. The system will validate your input, and once everything is correct, click the 'Change Password' button to update it.",
    },
    {
      question: "How can I view the terms and conditions of the website?",
      answer:
        "Click the 'Terms and Conditions' tab to view all policies and guidelines that govern the use of the system.",
    },
  ];
  const [activeTab, setActiveTab] = useState("edit-profile");

  useEffect(() => {
    document.title = "Operational Manager Settings";
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case "edit-profile":
        return <EditProfileTab />;
      case "change-password":
        return <ChangePasswordTab />;
      case "terms":
        return <ViewTermsTab />;
      default:
        return null;
    }
  };

  return (
    <OperationalLayout
      title={
        <div className="d-flex align-items-center gap-2">
          <span>Operational Settings</span>
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
    >
      <div className="settings-tabs mt-5">
        <button
          className={activeTab === "edit-profile" ? "active" : ""}
          onClick={() => setActiveTab("edit-profile")}
        >
          Edit Profile
        </button>
        <button
          className={activeTab === "change-password" ? "active" : ""}
          onClick={() => setActiveTab("change-password")}
        >
          Change Password
        </button>
        <button
          className={activeTab === "terms" ? "active" : ""}
          onClick={() => setActiveTab("terms")}
        >
          Terms & Conditions
        </button>
      </div>

      <div className="settings-container">
        <div className="settings-content">{renderTabContent()}</div>
      </div>
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
          <Modal.Title>Guide for Operational Settings</Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ backgroundColor: "#f8f9fa" }}>
          <p className="px-3 text-justify mb-4" style={{ color: "#333" }}>
            The Operational Settings page allows you to manage and customize
            your account preferences. From here, you can edit your profile
            information, change your password, and review the system’s terms and
            conditions. Each tab provides dedicated tools for updating your
            credentials and maintaining the security and integrity of your
            account data.
          </p>

          <div className="px-3 mb-3">
            <div className="accordion" id="faqAccordionOperational">
              {guideqst.map((faq, index) => (
                <div
                  className="accordion-item mb-3 shadow-sm border-0"
                  key={index}
                >
                  <h2
                    className="accordion-header"
                    id={`headingOperational${index}`}
                  >
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
                      aria-controls={`collapseOperational${index}`}
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
                    id={`collapseOperational${index}`}
                    className={`accordion-collapse collapse ${
                      activeFAQIndex === index ? "show" : ""
                    }`}
                    aria-labelledby={`headingOperational${index}`}
                    data-bs-parent="#faqAccordionOperational"
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

export default OperationalSettings;
