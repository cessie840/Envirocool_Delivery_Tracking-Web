import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Toaster } from "sonner";

// Public pages
import Login from "./Login";
import ForgotPass from "./ForgotPass";

// ADMIN
import AdminDashboard from "./AdminDashboard";
import AddDelivery from "./AdminAddDelivery";
import DeliveryDetails from "./AdminDeliveryDetails";
import ViewDelivery from "./AdminViewOrder";
import MonitorDelivery from "./AdminMonitorDelivery";
import GenerateReport from "./AdminGenerateReport";
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

// Protected route
import ProtectedRoute from "./ProtectedRoute";

const NotAuthorized = () => (
  <div style={{ textAlign: "center", marginTop: "50px" }}>
    <h1>Access Denied</h1>
    <p>You don’t have permission to view this page.</p>
  </div>
);

function App() {
  const routes = [
    // ADMIN
    { path: "/admin-dashboard", element: <AdminDashboard />, role: "admin" },
    { path: "/add-delivery", element: <AddDelivery />, role: "admin" },
    { path: "/delivery-details", element: <DeliveryDetails />, role: "admin" },
    {
      path: "/view-delivery/:transaction_id",
      element: <ViewDelivery />,
      role: "admin",
    },
    { path: "/monitor-delivery", element: <MonitorDelivery />, role: "admin" },
    { path: "/generate-report", element: <GenerateReport />, role: "admin" },
    { path: "/admin-settings", element: <AdminSettings />, role: "admin" },

    // OPERATIONAL
    {
      path: "/operational-delivery-details",
      element: <OperationalDelivery />,
      role: "operationalmanager",
    },
    {
      path: "/operational-settings",
      element: <OperationalSettings />,
      role: "operationalmanager",
    },
    {
      path: "/register-account",
      element: <RegisterAccount />,
      role: "operationalmanager",
    },
    {
      path: "/personnel-accounts",
      element: <PersonnelAccounts />,
      role: "operationalmanager",
    },
    {
      path: "/create-personnel-account",
      element: <CreatePersonnelAccount />,
      role: "operationalmanager",
    },

    // DRIVER
    {
      path: "/driver-dashboard",
      element: <DriverDashboard />,
      role: "deliverypersonnel",
    },
    {
      path: "/out-for-delivery",
      element: <OutForDelivery />,
      role: "deliverypersonnel",
    },
    {
      path: "/successful-delivery",
      element: <SuccessfulDelivery />,
      role: "deliverypersonnel",
    },
    {
      path: "/failed-delivery",
      element: <FailedDeliveries />,
      role: "deliverypersonnel",
    },
    {
      path: "/driver-profile-settings",
      element: <DriverProfileSettings />,
      role: "deliverypersonnel",
    },
    {
      path: "/driver-guide",
      element: <DriverGuidePage />,
      role: "deliverypersonnel",
    },

    // SETTINGS
    { path: "/settings/edit-profile", element: <EditProfileTab /> },
    { path: "/settings/change-password", element: <ChangePasswordTab /> },
    { path: "/settings/account-security", element: <AccountSecurityTab /> },
    { path: "/settings/backup-restore", element: <BackupRestoreTab /> },
    { path: "/settings/view-terms", element: <ViewTermsTab /> },
  ];

  return (
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
  );
}

export default App;
