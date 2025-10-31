import React, { useState, useEffect } from "react";
import AdminLayout from "../AdminLayout";
import EditProfileTab from "./EditProfileTab";
import ChangePasswordTab from "./ChangePasswordTab";
import BackupRestoreTab from "./BackupRestoreTab";
import ViewTermsTab from "./ViewTermsTab";
import "./settings.css";
import { HiQuestionMarkCircle } from "react-icons/hi";

import { Button, Modal } from "react-bootstrap";

const AdminSettings = () => {
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
      question: "How can I back up my data?",
      answer:
        "Navigate to the 'Backup and Restore' tab. To back up your data, click 'Download Backup Data' — this will generate and download a copy of the current database to your computer.",
    },
    {
      question: "How can I restore my data?",
      answer:
        "Under the 'Backup and Restore' tab, go to the 'Restore Options' section. Click 'Choose File', select your previously backed-up .sql file from your computer, and then click 'Restore Database' to import and restore your data.",
    },
    {
      question: "How can I view the terms and conditions of the website?",
      answer:
        "Click the 'Terms and Conditions' tab to view all policies and guidelines that govern the use of the system.",
    },
  ];

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("adminActiveTab") || "edit-profile";
  });

  useEffect(() => {
    document.title = "Admin Settings";
  }, []);

  useEffect(() => {
    localStorage.setItem("adminActiveTab", activeTab);
  }, [activeTab]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "edit-profile":
        return <EditProfileTab />;
      case "change-password":
        return <ChangePasswordTab />;
      case "backup-restore":
        return <BackupRestoreTab />;
      case "terms":
        return <ViewTermsTab />;
      default:
        return null;
    }
  };

  return (
    <AdminLayout
      title={
        <div className="d-flex align-items-center gap-2">
          <span>Admin Settings</span>
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
      showSearch={false}
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
          className={activeTab === "backup-restore" ? "active" : ""}
          onClick={() => setActiveTab("backup-restore")}
        >
          Backup & Restore
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
          <Modal.Title>Guide for Admin Settings</Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ backgroundColor: "#f8f9fa" }}>
          <p className="px-3 text-justify mb-4" style={{ color: "#333" }}>
            The Admin Settings page allows you to manage and customize your
            account preferences. From here, you can edit your profile
            information, change your password, back up or restore data, and
            review the system’s terms and conditions. Each tab provides
            dedicated tools for updating your credentials and maintaining the
            security and integrity of your account data.
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
    </AdminLayout>
  );
};

export default AdminSettings;
