import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Toaster } from "sonner";
import { UserProvider } from "./UserContext";

// PUBLIC PAGES
import Login from "./Login";
import ForgotPass from "./ForgotPass";
import SystemAdminRolesAndPermission from "./SystemAdminRolesAndPermission";

// ADMIN
import AdminDashboard from "./AdminDashboard";
import AddDelivery from "./AdminAddDelivery";
import DeliveryDetails from "./AdminDeliveryDetails";
import ViewDelivery from "./AdminViewOrder";
import MonitorDelivery from "./AdminMonitorDelivery";
import GenerateReport from "./AdminGenerateReport";
// import UserCreatePersonnelAccount from "./UserCreatePersonnelAccount";
import UserManagement from "./UserManagement";
import AdminSettings from "./settings/AdminSettings";

// OPERATIONAL
import OperationalDelivery from "./OperationalDelivery";
import OperationalSettings from "./settings/OperationalSettings";
import RegisterAccount from "./RegisterAccount";
import PersonnelAccounts from "./PersonnelAccounts";
import CreatePersonnelAccount from "./CreatePersonnelAccount";

// DRIVER
import DriverDashboard from "./DriverDashboard";
import OutForDelivery from "./OutForDelivery";
import SuccessfulDelivery from "./SuccessfulDelivery";
import FailedDeliveries from "./FailedDeliveries";
import DriverProfileSettings from "./DriverProfileSettings";
import DriverGuidePage from "./DriverGuidePage";

// SETTINGS
import EditProfileTab from "./settings/EditProfileTab";
import ChangePasswordTab from "./settings/ChangePasswordTab";
import AccountSecurityTab from "./settings/AccountSecurityTab";
import BackupRestoreTab from "./settings/BackupRestoreTab";
import ViewTermsTab from "./settings/ViewTermsTab";

import ProtectedRoute from "./ProtectedRoute";

const NotAuthorized = () => (
  <div style={{ textAlign: "center", marginTop: "100px" }}>
    <div>
      <h1 style={{ color: "#d9534f", marginBottom: "10px" }}>Access Denied!</h1>
      <p style={{ fontSize: "16px", marginBottom: "20px", color: "#555" }}>
        You don’t have permission to view this page.
      </p>

      <button
        onClick={() => window.history.back()}
        style={{
          background: "#838181FF",
          color: "#fff",
          border: "none",
          padding: "8px 25px",
          borderRadius: "8px",
          fontSize: "15px",
          cursor: "pointer",
        }}
      >
        Go Back
      </button>
    </div>
  </div>
);

function App() {
  const routes = [
    // ADMIN
    {
      path: "/admin-dashboard",
      element: <AdminDashboard />,
      role: ["data-admin", "staff-admin", "system-admin"],
    },
    {
      path: "/add-delivery",
      element: <AddDelivery />,
      role: ["data-admin", "staff-admin", "system-admin"],
    },
    {
      path: "/delivery-details",
      element: <DeliveryDetails />,
      role: ["data-admin", "staff-admin", "system-admin"],
    },
    {
      path: "/view-delivery/:transaction_id",
      element: <ViewDelivery />,
      role: ["data-admin", "staff-admin", "system-admin"],
    },
    {
      path: "/monitor-delivery",
      element: <MonitorDelivery />,
      role: ["data-admin", "staff-admin", "system-admin"],
    },
    {
      path: "/generate-report",
      element: <GenerateReport />,
      role: ["data-admin", "system-admin"],
    },
    {
      path: "/user-management",
      element: <UserManagement />,
      role: ["system-admin"],
    },
    // { path: "/create-personnel-account", element: <UserCreatePersonnelAccount />, role: ["system-admin"] },
    {
      path: "/admin-settings",
      element: <AdminSettings />,
      role: ["data-admin", "staff-admin", "system-admin"],
    },
    {
      path: "/roles-permission",
      element: <SystemAdminRolesAndPermission />,
      role: ["system-admin"],
    },

    // OPERATIONAL
    {
      path: "/operational-delivery-details",
      element: <OperationalDelivery />,
      role: ["operational-manager"],
    },
    {
      path: "/operational-settings",
      element: <OperationalSettings />,
      role: ["operational-manager"],
    },
    {
      path: "/register-account",
      element: <RegisterAccount />,
      role: ["operational-manager"],
    },
    {
      path: "/personnel-accounts",
      element: <PersonnelAccounts />,
      role: ["operational-manager"],
    },
    {
      path: "/create-personnel-account-ops",
      element: <CreatePersonnelAccount />,
      role: ["operational-manager"],
    },

    // DRIVER
    {
      path: "/driver-dashboard",
      element: <DriverDashboard />,
      role: ["delivery-personnel"],
    },
    {
      path: "/out-for-delivery",
      element: <OutForDelivery />,
      role: ["delivery-personnel"],
    },
    {
      path: "/successful-delivery",
      element: <SuccessfulDelivery />,
      role: ["delivery-personnel"],
    },
    {
      path: "/failed-delivery",
      element: <FailedDeliveries />,
      role: ["delivery-personnel"],
    },
    {
      path: "/driver-profile-settings",
      element: <DriverProfileSettings />,
      role: ["delivery-personnel"],
    },
    {
      path: "/driver-guide",
      element: <DriverGuidePage />,
      role: ["delivery-personnel"],
    },

    // SETTINGS (accessible to all logged-in users)
    { path: "/settings/edit-profile", element: <EditProfileTab /> },
    { path: "/settings/change-password", element: <ChangePasswordTab /> },
    { path: "/settings/account-security", element: <AccountSecurityTab /> },
    { path: "/settings/backup-restore", element: <BackupRestoreTab /> },
    { path: "/settings/view-terms", element: <ViewTermsTab /> },
  ];

  return (
    <UserProvider>
      <Router>
        <Toaster position="top-center" richColors />

        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/" element={<Login />} />
          <Route path="/forgotpassword" element={<ForgotPass />} />
          <Route path="/not-authorized" element={<NotAuthorized />} />

          {/* PROTECTED ROUTES */}
          {routes.map(({ path, element, role }) => (
            <Route
              key={path}
              path={path}
              element={<ProtectedRoute role={role}>{element}</ProtectedRoute>}
            />
          ))}
        </Routes>
      </Router>
    </UserProvider>
  );
}
export default App;
