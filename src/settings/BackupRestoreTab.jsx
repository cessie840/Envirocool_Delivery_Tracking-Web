import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  FaDownload,
  FaUpload,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaExclamationTriangle,
  FaDatabase,
} from "react-icons/fa";

const BackupRestoreTab = () => {
  const [backupStatus, setBackupStatus] = useState("");
  const [restoreStatus, setRestoreStatus] = useState("");
  const [restoreFile, setRestoreFile] = useState(null);
  const [successMsg, setSuccessMsg] = useState(""); 

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

      const dbName =
        response.headers["x-database-name"] || "DeliveryTrackingSystem";

      const now = new Date();
      const pad = (n) => n.toString().padStart(2, "0");
      const filename = `backup_${dbName}_${now.getFullYear()}-${pad(
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

  const handleFileChange = (e) => {
    setRestoreFile(e.target.files[0]);
  };

  const handleRestoreSubmit = async (e) => {
    e.preventDefault();

    if (!restoreFile) {
      setRestoreStatus("No file selected.");
      return;
    }

    const confirmRestore = await Swal.fire({
      title: "Confirm Restore",
      text: "Restoring will overwrite your current database data. Do you want to continue?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#288B44FF",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, restore it",
    });

    if (!confirmRestore.isConfirmed) {
      setRestoreStatus("Restore cancelled.");
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
        setSuccessMsg(
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
              padding: "3px",
              color: "#2e7d32",
              borderRadius: "6px",
              fontWeight: "600",
              fontSize: "18px",
            }}
          >
            <FaCheckCircle color="#2e7d32" />
            Database restored successfully!
          </div>
        );

        setRestoreStatus("Restore completed successfully.");

        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setRestoreStatus("Restore failed: " + res.data.message);
      }
    } catch (err) {
      setRestoreStatus("Restore error: " + err.message);
    }
  };

  return (
    <div className="p-3 position-relative">
      {successMsg && (
        <div
          className="alert alert-success text-center position-fixed top-0 start-50 translate-middle-x shadow"
          style={{
            zIndex: 1050,
            width: "100%",
            maxWidth: "600px",
            borderRadius: "0 0 8px 8px",
            animation: "fadeInOut 3s ease-in-out",
            border: "1px solid #698F6BFF",
          }}
        >
          {successMsg}
        </div>
      )}

      <h4 className="title mb-1">
        <FaDatabase /> Backup & Restore
      </h4>
      <p className="text-dark">
        Manage your database backups and restore options below.
      </p>

      <div className="alert alert-info d-flex align-items-center" role="alert">
        <FaInfoCircle className="me-2" />
        <span>
          You can <strong>download a full backup</strong> of your database as a
          <code> .sql</code> file and use it later to
          <strong> restore your system</strong> to this exact state.
        </span>
      </div>

      <hr />

      <section className="mb-5">
        <h5>Backup Data</h5>
        <button
          className="btn add-btn mb-2 px-4 py-2 fs-6 rounded-2"
          onClick={handleBackupClick}
        >
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
          <button
            type="submit"
            className="btn btn-view px-4 py-2 fs-6 rounded-2"
          >
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
          <div className="alert alert-warning mt-3" role="alert">
            <FaExclamationTriangle className="me-2 text-danger" />
            <b className="text-danger">Warning:</b> Restoring a backup will
            permanently replace all current data in your database. Make sure you
            have the correct file before proceeding.
          </div>
        )}
      </section>

      <style>
        {`
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(-20px); }
            10%, 90% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-20px); }
          }
        `}
      </style>
    </div>
  );
};

export default BackupRestoreTab;
