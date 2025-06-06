import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, role }) => {
	const user = JSON.parse(localStorage.getItem("user"));

	if (!user) {
		// Not logged in
		return <Navigate to="/" />;
	}

	if (role && user.role !== role) {
		// Logged in but wrong role
		return <Navigate to="/" />;
	}

	return children;
};

export default ProtectedRoute;
