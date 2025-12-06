import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, role }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  // Not logged in
  if (!user) {
    return <Navigate to="/" />;
  }

  // Check role
  if (role && user.role !== role) {
    return <Navigate to="/" />;
  }

  // Special case: only systemadmin can access /roles-permission
  if (window.location.pathname === "/roles-permission") {
    if (user.ad_username !== "systemadmin") {
      return <Navigate to="/not-authorized" />;
    }
  }

  return children;
};

export default ProtectedRoute;
