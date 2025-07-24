import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "leaflet/dist/leaflet.css";

import Login from "./Login";
import AdminDashboard from "./AdminDashboard";
import ForgotPass from "./ForgotPass";
import AddDelivery from "./AdminAddDelivery";
import DeliveryDetails from "./AdminDeliveryDetails";
import ViewDelivery from "./AdminViewOrder";
import MonitorDelivery from "./AdminMonitorDelivery";
import GenerateReport from "./AdminGenerateReport";
import DriverModule from "./DriverDashboard";
import OperationalDelivery from "./OperationalDelivery";
import CreatePersonnelAccount from "./CreatePersonnelAccount";
import ProtectedRoute from "./ProtectedRoute";
import RegisterAccount from "./RegisterAccount";
import PersonnelAccounts from "./PersonnelAccounts";
import DriverDashboard from "./DriverDashboard";
import OutForDelivery from "./OutForDelivery";
import SuccessfulDelivery from "./SuccessfulDelivery";
import FailedDeliveries from "./FailedDeliveries";
import DriverProfileSettings from "./DriverProfileSettings";

import AdminSettings from "./settings/AdminSettings";
import OperationalSettings from "./settings/OperationalSettings";

import EditProfileTab from "./settings/EditProfileTab";
import ChangePasswordTab from "./settings/ChangePasswordTab";
import AccountSecurityTab from "./settings/AccountSecurityTab";
import BackupRestoreTab from "./settings/BackupRestoreTab";
import ViewTermsTab from "./settings/ViewTermsTab";

import Customer from "./Customer";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* PROTECTED ROUTES - ROLE BASED ACCESS  */}
        <Route path="/" element={<Login />} />
        <Route path="/admin-dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/operational-delivery-details" element={<ProtectedRoute role="operationalmanager"><OperationalDelivery /></ProtectedRoute>} />
        <Route path="/driver-dashboard" element={<ProtectedRoute role="deliverypersonnel"><DriverDashboard /></ProtectedRoute>}/>
        <Route path="/forgotpassword" element={<ForgotPass />} />

        {/* ADMIN ROUTES  */}
        <Route path="/add-delivery" element={<AddDelivery />} />
        <Route path="/delivery-details" element={<DeliveryDetails />} />
        <Route path="/view-delivery/:transaction_id" element={<ViewDelivery />} />
        <Route path="/monitor-delivery" element={<MonitorDelivery />} />
        <Route path="/generate-report" element={<GenerateReport />} />
        <Route path="/admin-settings" element={<AdminSettings />} />

        {/* OPERATIONAL ROUTES  */}
        <Route path="/operational-settings" element={<OperationalSettings />} />
        <Route path="/register-account" element={<RegisterAccount />} />
        <Route path="/personnel-accounts" element={<PersonnelAccounts />} />
        <Route path="/create-personnel-account" element={<CreatePersonnelAccount />} />

        {/* DELIVERY PERSONNEL ROUTES  */}
        <Route path="/driver-dashboard" element={<DriverDashboard />} />
        <Route path="/out-for-delivery" element={<OutForDelivery />} />
        <Route path="/successful-delivery" element={<SuccessfulDelivery />} />
        <Route path="/failed-delivery" element={<FailedDeliveries />} />
        <Route path="/driver-profile-settings" element={<DriverProfileSettings />} />
        {/* <Route path="/DriverDashboard" element={<ProtectedRoute role="deliverypersonnel"><DriverModule /></ProtectedRoute>} /> */}

        {/* SETTINGS ROUTES  */}
        <>
        <Route path="/settings/edit-profile" element={<EditProfileTab />} />
        <Route path="/settings/change-password" element={<ChangePasswordTab />} />
        <Route path="/settings/account-security" element={<AccountSecurityTab />} />
        <Route path="/settings/backup-restore" element={<BackupRestoreTab />} />
        <Route path="/settings/view-terms" element={<ViewTermsTab />} />
      </>

      

      ;

      </Routes>
    </Router>
  );
}

export default App;