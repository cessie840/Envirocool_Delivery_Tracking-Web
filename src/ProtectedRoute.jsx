import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, role }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    return <Navigate to="/" />;
  }

  if (role) {
    const allowedRoles = Array.isArray(role) ? role : [role];
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/not-authorized" />;
    }
  }

  if (window.location.pathname === "/roles-permission") {
    if (user.ad_username !== "systemadmin") {
      return <Navigate to="/not-authorized" />;
    }
  }

  return children;
};

export default ProtectedRoute;
