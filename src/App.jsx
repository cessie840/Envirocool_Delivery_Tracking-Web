import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login";
import AdminDashboard from "./AdminDashboard";
import ForgotPass from "./ForgotPass";
import AddDelivery from "./AdminAddDelivery";
import DeliveryDetails from "./AdminDeliveryDetails";
import ViewDelivery from "./AdminViewOrder";
import MonitorDelivery from "./AdminMonitorDelivery";
import GenerateReport from "./AdminGenerateReport";
import Settings from "./AdminSettings";
import DriverModule from "./DriverDashboard";
import OperationalDelivery from "./OperationalDelivery";
import CreatePersonnelAccount from "./CreatePersonnelAccount";
import ProtectedRoute from "./ProtectedRoute";
import OperationalSettings from "./OperationalSettings";
import RegisterAccount from "./RegisterAccount";
import PersonnelAccounts from "./PersonnelAccounts";
import DriverDashboard from "./DriverDashboard";
import OutForDelivery from "./OutForDelivery";
import SuccessfulDelivery from "./SuccessfulDelivery";
import FailedDeliveries from "./FailedDeliveries";
import DriverProfileSettings from "./DriverProfileSettings";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/operational-delivery-details"
          element={
            <ProtectedRoute role="operationalmanager">
              <OperationalDelivery />
            </ProtectedRoute>
          }
        />

        <Route path="/forgotpassword" element={<ForgotPass />} />
        <Route path="/add-delivery" element={<AddDelivery />} />
        <Route path="/delivery-details" element={<DeliveryDetails />} />
        <Route path="/view-delivery/:transaction_id" element={<ViewDelivery />} />

        <Route path="/monitor-delivery" element={<MonitorDelivery />} />
        <Route path="/generate-report" element={<GenerateReport />} />
        <Route path="/settings" element={<Settings />} />

        <Route
          path="operational-settings"
          element={<OperationalSettings />}
        ></Route>
        <Route path="/register-account" element={<RegisterAccount />} />
        <Route path="/personnel-accounts" element={<PersonnelAccounts />} />
        <Route
          path="/create-personnel-account"
          element={<CreatePersonnelAccount />}
        />

        <Route path="/driver-dashboard" element={<DriverDashboard />} />
        <Route path="/out-for-delivery" element={<OutForDelivery />} />
        <Route path="/successful-delivery" element={<SuccessfulDelivery />} />
        <Route path="/failed-delivery" element={<FailedDeliveries />} />
        <Route
          path="/driver-profile-settings"
          element={<DriverProfileSettings />}
        />

        {/* <Route
          path="/DriverDashboard"
          element={
            <ProtectedRoute role="deliverypersonnel">
              <DriverModule />
            </ProtectedRoute>
          }
        /> */}
      </Routes>
    </Router>
  );
}

export default App;
