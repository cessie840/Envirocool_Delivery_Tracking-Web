import React, { useState, useEffect } from "react";
import AdminLayout from "../AdminLayout";
import StaffAdminLayout from "../StaffAdminLayout";
import EditProfileTab from "./EditProfileTab";
import ChangePasswordTab from "./ChangePasswordTab";
import BackupRestoreTab from "./BackupRestoreTab";
import ViewTermsTab from "./ViewTermsTab";
import "./settings.css";
import { HiQuestionMarkCircle } from "react-icons/hi";
import SystemAdminLayout from "../SystemAdminLayout";

import { Button, Modal } from "react-bootstrap";

const AdminSettings = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const isStaffAdmin = user?.ad_username === "staffadmin";

  const [showFAQ, setShowFAQ] = useState(false);
  const [activeFAQIndex, setActiveFAQIndex] = useState(null);
  const username = localStorage.getItem("username");
  const Layout = username === "systemadmin" ? SystemAdminLayout : AdminLayout;

  const guideqst = [
    {
      question: "How can I edit my profile?",
      answer:
        "Click the 'Edit Profile' tab to display your current account details.\n\n" +
        "Then, click the 'Edit' button to enable the input fields where you can update your credentials such as Username, First Name, Last Name, Email, and Phone.\n\n" +
        "After making changes, click 'Save' and confirm to apply your updates.",
    },
    {
      question: "How can I change my password?",
      answer:
        "Go to the 'Change Password' tab to open the password settings.\n\n" +
        "Enter your current password, then your new password, and confirm it again.\n\n" +
        "The system validates your input, and once correct, click 'Change Password' to update it.",
    },
    {
      question: "What if I forgot my password before logging in?",
      answer:
        "If you forgot your password, go to the Login page and click the 'Forgot password?' link below the login form.\n\n" +
        "Enter your registered email address — a reset code will be sent to your inbox.\n\n" +
        "Use that code to verify your identity, then create a new password that meets the system’s security requirements.",
    },
    {
      question: "How can I back up my data?",
      answer:
        "Navigate to the 'Backup and Restore' tab.\n\n" +
        "Click 'Download Backup Data' to generate and download a copy of the current database to your computer.\n\n" +
        "This helps preserve important delivery and transaction records.",
    },
    {
      question: "How can I restore my data?",
      answer:
        "Under the 'Backup and Restore' tab, go to the 'Restore Options' section.\n\n" +
        "Click 'Choose File', select your previously backed-up .sql file, and then click 'Restore Database' to import your saved data.\n\n" +
        "Restoring data will overwrite the current database, so proceed carefully.",
    },
    {
      question:
        "What is the purpose of the Terms and Conditions in the system?",
      answer:
        "The Terms and Conditions define how the Envirocool Delivery & Monitoring System should be used by all authorized users.\n\n" +
        "It ensures that every Admin, Operational Manager, and Delivery Personnel understands the system’s purpose, data privacy policies, and proper usage of system features.",
    },
    {
      question: "Who manages and updates the Terms and Conditions?",
      answer:
        "Only the system developers are authorized to edit or update the Terms and Conditions.\n\n" +
        "If revisions are required, staff members must contact the developers to request the necessary updates.\n\n" +
        "Once approved and implemented, all changes will automatically reflect across all user accounts to ensure consistent policies and compliance.",
    },
    {
      question: "How does the system ensure data security?",
      answer:
        "The system limits access to sensitive features like Backup, Restore, and Password changes to authorized users only.\n\n" +
        "All data is stored securely and complies with the Data Privacy Act of 2012.\n\n" +
        "Unauthorized access, data sharing, or misuse of information is strictly prohibited.",
    },
    {
      question: "What should I do if my account becomes locked?",
      answer:
        "If your account becomes locked after multiple failed login attempts, you’ll need to reset your password using the 'Forgot Password?' link on the login page.\n\n" +
        "Follow the password reset process sent to your registered email. If the issue persists, contact the system administrator or developer for further assistance.",
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

  const content = (
    <>
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
            onClick={() => {
              setShowFAQ(false);
              setActiveFAQIndex(null);
            }}
            className="close-btn py-2 px-4 fs-6 rounded-2"
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );

  if (isStaffAdmin) {
    return (
      <StaffAdminLayout
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
      >
        {content}
      </StaffAdminLayout>
    );
  }

  return (
    <Layout
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
      {content}
    </Layout>
  );
};

export default AdminSettings;
