import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OperationalLayout from "./OperationalLayout";

const Settings = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Operational Manager Settings";
  }, []);

  return (
    <OperationalLayout title="Monitor Delivery">
      {/* DASHBOARD CONTENT */}
      <div className="dashboard-content text-center mt-5 fs-4 border p-5">
        <p>Operational Settings</p>
      </div>
    </OperationalLayout>
  );
};

export default Settings;
