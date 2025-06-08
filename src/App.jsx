import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login";
import AdminDashboard from "./AdminDashboard";
import AdminModule from "./AdminDashboard";
import ForgotPass from "./ForgotPass";
import AddDelivery from "./AddDelivery";
import DeliveryDetails from "./DeliveryDetails";
import ViewDelivery from "./ViewOrder"
import MonitorDelivery from "./MonitorDelivery";
import GenerateReport from "./GenerateReport";
import Settings from "./Settings";
import OperationalManagerModule from "./OpsDashboard";
import DriverModule from "./DriverDashboard";
import ProtectedRoute from "./ProtectedRoute";

import OperationalDelivery from "./OperationalDelivery"
import CreatePersonnelAccount from "./CreatePersonnelAccount";
import "bootstrap/dist/css/bootstrap.min.css";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/forgotpassword" element={<ForgotPass />} />
        <Route path="/add-delivery" element={<AddDelivery />} />
        <Route path="/delivery-details" element={<DeliveryDetails />} />
        <Route path="/view-delivery" element={<ViewDelivery />} />
        <Route path="/monitor-delivery" element={<MonitorDelivery />} />
        <Route path="/generate-report" element={<GenerateReport />} />
        <Route path="/settings" element={<Settings />} />

        <Route path="/operational-delivery-details" element={<OperationalDelivery />} />
        <Route path="/create-personnel-account" element={<CreatePersonnelAccount />} />

        <Route
          path="/OperationalManagerDashboard"
          element={
            <ProtectedRoute role="operationalmanager">
              <OperationalManagerModule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/DriverDashboard"
          element={
            <ProtectedRoute role="driver">
              <DriverModule />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role="admin">
              <AdminModule />
            </ProtectedRoute>
          }
        />
       
      </Routes>
    </Router>
  );
}

export default App;
