import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginModule from "./Login";
import AdminModule from "./AdminDashboard";
import OperationalManagerModule from "./OpsDashboard";
import DriverModule from "./DriverDashboard";
import ForgotPass from "./ForgotPass";
import ProtectedRoute from "./ProtectedRoute";

function App() {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<LoginModule />} />
				<Route
					path="/AdminDashboard"
					element={
						<ProtectedRoute role="admin">
							<AdminModule />
						</ProtectedRoute>
					}
				/>
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
				<Route path="/forgotpassword" element={<ForgotPass />} />
			</Routes>
		</Router>
	);
}

export default App;
