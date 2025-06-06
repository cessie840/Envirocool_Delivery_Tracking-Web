import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login";
import AdminDashboard from "./AdminDashboard";
import OpsDashboard from "./OpsDashboard";
import DriverDashboard from "./DriverDashboard";
import ForgotPass from "./ForgotPass";

function App() {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<Login />} />
				<Route path="/admindash" element={<AdminDashboard />} />
				<Route path="/opsdash" element={<OpsDashboard />} />
				<Route path="/driverdash" element={<DriverDashboard />} />
				<Route path="/forgotpassword" element={<ForgotPass />} />
			</Routes>
		</Router>
	);
}

export default App;
