import React, { useState } from "react";
import axios from "axios";
import {
  FaDownload,
  FaUpload,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
} from "react-icons/fa";

const BackupRestoreTab = () => {
  const [backupStatus, setBackupStatus] = useState("");
  const [restoreStatus, setRestoreStatus] = useState("");
  const [restoreFile, setRestoreFile] = useState(null);

  // Handle Backup
  const handleBackupClick = async () => {
    try {
      const response = await axios.get(
        "http://localhost/DeliveryTrackingSystem/backup.php",
        {
          responseType: "blob",
          withCredentials: true,
        }
      );

      const blob = new Blob([response.data], { type: "application/sql" });

      // Generate filename: DatabaseName_YYYY-MM-DD_HH-MM.sql
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, "0");
      const filename = `DeliveryTrackingSystem_${now.getFullYear()}-${pad(
        now.getMonth() + 1
      )}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(
        now.getMinutes()
      )}.sql`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      setBackupStatus("Backup downloaded successfully.");
    } catch (error) {
      console.error("Backup failed:", error);
      setBackupStatus("Backup failed. Please try again.");
    }
  };

  // Handle File Selection
  const handleFileChange = (e) => {
    setRestoreFile(e.target.files[0]);
  };

  // Handle Restore
  const handleRestoreSubmit = async (e) => {
    e.preventDefault();

    if (!restoreFile) {
      setRestoreStatus("No file selected.");
      return;
    }

    const confirmRestore = window.confirm(
      "Restoring will overwrite your current database data.\n\nDo you want to continue?"
    );
    if (!confirmRestore) {
      setRestoreStatus("Restore cancelled by user.");
      return;
    }

    const formData = new FormData();
    formData.append("sqlFile", restoreFile);

    try {
      const res = await axios.post(
        "http://localhost/DeliveryTrackingSystem/restore.php",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      if (res.data.success) {
        setRestoreStatus("Restore completed successfully.");
      } else {
        setRestoreStatus("Restore failed: " + res.data.message);
      }
    } catch (err) {
      setRestoreStatus("Restore error: " + err.message);
    }
  };

  return (
    <div className="p-3">
      <h4 className="title mb-3">Backup & Restore</h4>
      <p className="text-muted">
        Manage your database backups and restore options below.
      </p>
      <hr />

      {/* Backup Section */}
      <section className="mb-5">
        <h5>Backup Data</h5>
        <button className="btn add-btn mb-2 px-3 py-2 fs-6 rounded-2" onClick={handleBackupClick}>
          <FaDownload className="me-2" />
          Download Backup
        </button>
        {backupStatus && (
          <p
            className={
              backupStatus.includes("successfully")
                ? "text-success"
                : "text-danger"
            }
          >
            {backupStatus.includes("successfully") ? (
              <FaCheckCircle className="me-2" />
            ) : (
              <FaTimesCircle className="me-2" />
            )}
            {backupStatus}
          </p>
        )}
      </section>

      <hr />

      {/* Restore Section */}
      <section>
        <h5>Restore Options</h5>
        <form onSubmit={handleRestoreSubmit}>
          <div className="form-group mb-3">
            <label className="form-label">Upload SQL Backup File</label>
            <input
              type="file"
              name="sqlFile"
              className="form-control"
              accept=".sql"
              onChange={handleFileChange}
            />
          </div>
          <button type="submit" className="btn btn-view px-3 py-2 fs-6">
            <FaUpload className="me-2" />
            Restore Database
          </button>
        </form>

        {restoreStatus && (
          <p
            className={
              restoreStatus.includes("successfully")
                ? "text-success mt-3"
                : "text-danger mt-3"
            }
          >
            {restoreStatus.includes("successfully") ? (
              <FaCheckCircle className="me-2" />
            ) : (
              <FaTimesCircle className="me-2" />
            )}
            {restoreStatus}
          </p>
        )}

        {!restoreStatus && (
          <p className="text-muted mt-3">
            <FaInfoCircle className="me-2" />
            Restoring will overwrite your current database. Proceed with caution.
          </p>
        )}
      </section>
    </div>
  );
};

export default BackupRestoreTab;
