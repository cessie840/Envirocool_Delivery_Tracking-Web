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
import { Toaster, toast } from "sonner"; // ✅ Added Sonner toaster

const BackupRestoreTab = () => {
  const [backupStatus, setBackupStatus] = useState("");
  const [restoreStatus, setRestoreStatus] = useState("");
  const [restoreFile, setRestoreFile] = useState(null);

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

      // ✅ Success toaster for backup
      toast.success("Backup downloaded successfully!", {
        duration: 2500,
        style: {
          background: "#E8F5E9",
          border: "1px solid #91C793FF",
          color: "#2E7D32",
          fontWeight: 600,
          fontSize: "1rem",
          textAlign: "center",
          width: "100%",
          maxWidth: "600px",
          margin: "0 auto",
          justifyContent: "center",
        },
      });
    } catch (error) {
      console.error("Backup failed:", error);
      setBackupStatus("Backup failed. Please try again.");

      toast.error("Backup failed. Please try again.", {
        duration: 2500,
        style: {
          background: "#FCE8E8",
          border: "1px solid #E57373",
          color: "#B71C1C",
          fontWeight: 600,
          fontSize: "1rem",
          textAlign: "center",
          width: "100%",
          maxWidth: "600px",
          margin: "0 auto",
          justifyContent: "center",
        },
      });
    }
  };

  const handleFileChange = (e) => {
    setRestoreFile(e.target.files[0]);
  };

  const handleRestoreSubmit = async (e) => {
    e.preventDefault();

    if (!restoreFile) {
      setRestoreStatus("No file selected.");
      toast.error("Please select a backup file before restoring.", {
        duration: 2500,
        style: {
          background: "#FCE8E8",
          border: "1px solid #E57373",
          color: "#B71C1C",
          fontWeight: 600,
          fontSize: "1rem",
          textAlign: "center",
          width: "100%",
          maxWidth: "600px",
          margin: "0 auto",
          justifyContent: "center",
        },
      });
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
        setRestoreStatus("Restore completed successfully.");

        // ✅ Success toaster for restore
        toast.success("Database restored successfully!", {
          duration: 2500,
          style: {
            background: "#DEF1E0FF",
            border: "1px solid #77BB79FF",
            color: "#2E7D32",
            fontWeight: 600,
            fontSize: "1.1rem",
            textAlign: "center",
            width: "100%",
            maxWidth: "600px",
            margin: "0 auto",
            justifyContent: "center",
          },
        });
      } else {
        setRestoreStatus("Restore failed: " + res.data.message);
        toast.error("Restore failed. Please check your SQL file.", {
          duration: 2500,
          style: {
            background: "#FCE8E8",
            border: "1px solid #E57373",
            color: "#B71C1C",
            fontWeight: 600,
            fontSize: "1rem",
            textAlign: "center",
            width: "100%",
            maxWidth: "600px",
            margin: "0 auto",
            justifyContent: "center",
          },
        });
      }
    } catch (err) {
      setRestoreStatus("Restore error: " + err.message);
      toast.error("An error occurred during restore.", {
        duration: 2500,
        style: {
          background: "#FCE8E8",
          border: "1px solid #E57373",
          color: "#B71C1C",
          fontWeight: 600,
          fontSize: "1rem",
          textAlign: "center",
          width: "100%",
          maxWidth: "600px",
          margin: "0 auto",
          justifyContent: "center",
        },
      });
    }
  };

  return (
    <div className="p-3 position-relative">
      <Toaster position="top-center" richColors /> {/* ✅ Sonner toaster added */}

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

      {/* 🔹 Backup Section */}
      <section className="mb-5">
        <h5>Backup Data</h5>
        <button
          className="btn add-btn mb-2 px-4 py-2 fs-6 rounded-2"
          onClick={handleBackupClick}
        >
          <FaDownload className="me-2" />
          Download Backup
        </button>
      </section>

      <hr />

      {/* 🔹 Restore Section */}
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

        {!restoreStatus && (
          <div className="alert alert-warning mt-3" role="alert">
            <FaExclamationTriangle className="me-2 text-danger" />
            <b className="text-danger">Warning:</b> Restoring a backup will
            permanently replace all current data in your database. Make sure you
            have the correct file before proceeding.
          </div>
        )}
      </section>
    </div>
  );
};

export default BackupRestoreTab;
