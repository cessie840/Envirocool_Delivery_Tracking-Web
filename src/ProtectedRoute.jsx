import { useEffect, useState, useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import axios from "axios";
import { UserContext } from "./UserContext";

const ROLE_PAGES = {
  "data-admin": [
    { path: "/admin-dashboard", perm: "AdminDashboard" },
    { path: "/add-transactions", perm: "AdminAddTransaction" },
    { path: "/delivery-details", perm: "AdminDeliveryDetails" },
    { path: "/analytics", perm: "AdminGenerateReport" },
    { path: "/settings", perm: "AdminSettings" },
  ],
  "staff-admin": [
    { path: "/staff-dashboard", perm: "AdminDashboard" },
    { path: "/delivery-details", perm: "AdminDeliveryDetails" },
    { path: "/settings", perm: "AdminSettings" },
  ],
  "system-admin": [
    { path: "/system-dashboard", perm: "AdminDashboard" },
    { path: "/roles-permissions", perm: "SystemAdminRolesAndPermission" },
    { path: "/user-management", perm: "UserManagement" },
    { path: "/settings", perm: "AdminSettings" },
  ],
  "operational-manager": [
    { path: "/personnel-accounts", perm: "CreatePersonnelAccount" },
    { path: "/operational-delivery-details", perm: "OperationalDelivery" },
    { path: "/operational-settings", perm: "OperationalSettings" },
  ],
  "delivery-personnel": [
    { path: "/driver-dashboard", perm: "DriverDashboard" },
    { path: "/out-for-delivery", perm: "OutForDelivery" },
    { path: "/successful-delivery", perm: "SuccessfulDelivery" },
    { path: "/failed-delivery", perm: "FailedDeliveries" },
    { path: "/driver-guide", perm: "DriverGuidePage" },
  ],
};

const ProtectedRoute = ({ children, requiredPermission, requiredRole }) => {
  const { user, setUser } = useContext(UserContext);
  const [hasAccess, setHasAccess] = useState(null);
  const [redirectPage, setRedirectPage] = useState("/");
  const location = useLocation();

  useEffect(() => {
    const fetchUserPermissions = async () => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (!storedUser) {
        setHasAccess(false);
        return;
      }

      if (!user) setUser(storedUser);

      let currentUser = storedUser;

      // Fetch permissions if missing
      if (!storedUser.permissions) {
        try {
          const res = await axios.post(
            "http://localhost/DeliveryTrackingSystem/get_user_permissions.php",
            {
              username: storedUser.username,
              role: storedUser.role,
            }
          );
          if (res.data.success) {
            currentUser = {
              ...storedUser,
              permissions: res.data.permissions || {},
            };
            localStorage.setItem("user", JSON.stringify(currentUser));
            setUser(currentUser);
          } else {
            setHasAccess(false);
            return;
          }
        } catch (err) {
          console.error(err);
          setHasAccess(false);
          return;
        }
      }

      checkAccess(currentUser);
    };

    const checkAccess = (currentUser) => {
      let allowed = true;

      if (requiredPermission) {
        const permValue = currentUser.permissions?.[requiredPermission];
        allowed = typeof permValue === "object" ? permValue.View : permValue;
      }

      if (requiredRole) {
        const allowedRoles = Array.isArray(requiredRole)
          ? requiredRole
          : [requiredRole];
        allowed = allowed && allowedRoles.includes(currentUser.role);
      }

      if (!requiredPermission && !requiredRole) {
        allowed =
          currentUser.permissions &&
          Object.values(currentUser.permissions).some(
            (v) => v === true || v?.View === true
          );
      }

      const pages = ROLE_PAGES[currentUser.role] || [];
      const firstAccessible = pages.find(
        (p) => currentUser.permissions?.[p.perm]
      );
      setRedirectPage(firstAccessible?.path || "/");

      setHasAccess(allowed ?? false);
    };

    fetchUserPermissions();
  }, [requiredPermission, requiredRole, user, setUser]);

  if (hasAccess === null) {
    return (
      <div className="loading-overlay d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Checking permissions...</span>
        </div>
      </div>
    );
  }

  if (!user && !localStorage.getItem("user")) {
    return <Navigate to="/" replace />;
  }

  if (!hasAccess) {
    return <Navigate to="/not-authorized" replace state={{ redirectPage }} />;
  }

  return children;
};

export default ProtectedRoute;
