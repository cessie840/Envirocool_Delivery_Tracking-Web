import React, { useState, useEffect } from "react";
import AdminLayout from "../AdminLayout";
import EditProfileTab from "./EditProfileTab";
import ChangePasswordTab from "./ChangePasswordTab";
import AccountSecurityTab from "./AccountSecurityTab";
import BackupRestoreTab from "./BackupRestoreTab"; 
import ViewTermsTab from "./ViewTermsTab";
import "./settings.css";

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState("edit-profile");

  useEffect(() => {
    document.title = "Admin Settings";
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case "edit-profile":
        return <EditProfileTab />;
      case "change-password":
        return <ChangePasswordTab />;
      case "security":
        return <AccountSecurityTab />;
      case "backup-restore":
        return <BackupRestoreTab />;
      case "terms":
        return <ViewTermsTab />;
      default:
        return null;
    }
  };

  return (
    <AdminLayout title="Admin Settings">
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

      {/* Content Inside Main Container */}
      <div className="settings-container">
        <div className="settings-content">{renderTabContent()}</div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
