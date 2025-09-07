import React, { useState, useEffect } from "react";
import AdminLayout from "../AdminLayout";
import EditProfileTab from "./EditProfileTab";
import ChangePasswordTab from "./ChangePasswordTab";

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
     
      case "backup-restore":
        return <BackupRestoreTab />;
      case "terms":
        return <ViewTermsTab />;
      default:
        return null;
    }
  };

  return (
    <AdminLayout title="Admin Settings" showSearch={false}>
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
    </AdminLayout>
  );
};

export default AdminSettings;
