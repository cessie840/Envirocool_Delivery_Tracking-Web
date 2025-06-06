import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Dashboard from "./Dashboard";
import AdminModule from "./AdminDashboard";
import ForgotPass from "./ForgotPass";
import AddDelivery from "./AddDelivery";
import DeliveryDetails from "./DeliveryDetails";
import MonitorDelivery from "./MonitorDelivery";
import GenerateReport from "./GenerateReport";
import Settings from "./Settings";
import OperationalManagerModule from "./OpsDashboard";
import DriverModule from "./DriverDashboard";
import ProtectedRoute from "./ProtectedRoute";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/forgotpassword" element={<ForgotPass />} />
        <Route path="/add-delivery" element={<AddDelivery />} />
        <Route path="/delivery-details" element={<DeliveryDetails />} />
        <Route path="/monitor-delivery" element={<MonitorDelivery />} />
        <Route path="/generate-report" element={<GenerateReport />} />
        <Route path="/settings" element={<Settings />} />

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
          path="/admindashboard"
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
