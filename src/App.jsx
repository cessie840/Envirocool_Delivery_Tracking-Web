import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login";
import AdminDashboard from "./AdminDashboard";
import OpsDashboard from "./OpsDashboard";
import DriverDashboard from "./DriverDashboard";
import ForgotPass from "./ForgotPass";
import ProtectedRoute from "./ProtectedRoute";

function App() {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<Login />} />
				<Route
					path="/admindash"
					element={
						<ProtectedRoute role="admin">
							<AdminDashboard />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/opsdash"
					element={
						<ProtectedRoute role="operationalmanager">
							<OpsDashboard />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/driverdash"
					element={
						<ProtectedRoute role="driver">
							<DriverDashboard />
						</ProtectedRoute>
					}
				/>
				<Route path="/forgotpassword" element={<ForgotPass />} />
			</Routes>
		</Router>
	);
}

export default App;
