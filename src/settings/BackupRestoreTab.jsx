import React, { useState } from "react";

const BackupRestoreTab = () => {
  const [backupStatus, setBackupStatus] = useState("");
  const [restoreStatus, setRestoreStatus] = useState("");
  const [restoreFileName, setRestoreFileName] = useState("");

  const handleBackupClick = () => {
    // Placeholder for backup logic
    setBackupStatus("Backup simulated. (Backend not connected)");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setRestoreFileName(file ? file.name : "");
  };

  const handleRestoreSubmit = (e) => {
    e.preventDefault();
    if (!restoreFileName) {
      setRestoreStatus("No file selected.");
    } else {
      // Placeholder for restore logic
      setRestoreStatus(`Restore simulated with file: ${restoreFileName}`);
    }
  };

  return (
    <div>
      <h4 className="title">Backup & Restore</h4>
      <p>Manage your data backup and restore options here.</p>
      <hr />

      {/* Backup Section */}
      <section className="mb-5">
        <h5>Backup Data</h5>
        <button className="btn add-btn mb-2" onClick={handleBackupClick}>
          Download Backup
        </button>
        {backupStatus && <p className="text-success">{backupStatus}</p>}
      </section>

      <hr />

      {/* Restore Section */}
      <section>
        <h5>Restore Options</h5>
        <form onSubmit={handleRestoreSubmit}>
          <div className="form-group mb-2">
            <label>Upload SQL Backup File</label>
            <input
              type="file"
              className="form-control"
              accept=".sql"
              onChange={handleFileChange}
            />
          </div>
          <button type="submit" className="btn btn-view mt-2">
            Restore
          </button>
        </form>
        {restoreStatus && <p className="text-info">{restoreStatus}</p>}
      </section>
    </div>
  );
};

export default BackupRestoreTab;
