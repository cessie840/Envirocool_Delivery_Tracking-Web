import React, { useState, useEffect } from "react";
import OperationalLayout from "../OperationalLayout";
import EditProfileTab from "./EditProfileTab";
import ChangePasswordTab from "./ChangePasswordTab";
import AccountSecurityTab from "./AccountSecurityTab";
import ViewTermsTab from "./ViewTermsTab";
import "./settings.css";

const OperationalSettings = () => {
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
      case "security":
        return <AccountSecurityTab />;
      case "terms":
        return <ViewTermsTab />;
      default:
        return null;
    }
  };

  return (
    <OperationalLayout title="Admin Settings">
      {/* Tabs Outside Main Container */}
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
          className={activeTab === "security" ? "active" : ""}
          onClick={() => setActiveTab("security")}
        >
          Account Security
        </button>
        <button
          className={activeTab === "terms" ? "active" : ""}
          onClick={() => setActiveTab("terms")}
        >
          Terms & Conditions
        </button>
      </div>

      {/* Content Inside Main Container */}
      <div className="settings-container">
        <div className="settings-content">{renderTabContent()}</div>
      </div>
    </OperationalLayout>
  );
};

export default OperationalSettings;
