import React, { useEffect, useState, useContext } from "react";
import { Tabs, Tab, Table, Form, Spinner } from "react-bootstrap";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import AdminLayout from "./AdminLayout";
import { UserContext } from "./UserContext";

// All possible permissions per role
const ALL_PERMISSIONS = {
  admin: [
    "AdminDashboard",
    "AdminDeliveryDetails",
    "AdminViewOrder",
    "UpdateOrderModal",
    "RescheduleModal",
    "AdminAddDelivery",
    "AdminMonitorDelivery",
    "AdminGenerateReport",
    "AdminSettings",
    "SystemAdminRolesAndPermission",
    "UserManagement",
    "CreatePersonnelAccount",
  ],
  operationalManager: [
    "CreatePersonnelAccount",
    "RegisterAccount",
    "OperationalDelivery",
    "PersonnelAccounts",
    "ViewPersonnelModal",
    "OperationalSettings",
  ],
  deliveryPersonnel: [
    "DriverDashboard",
    "DriverGuidePage",
    "DriverProfileSettings",
    "FailedDeliveries",
    "OutForDelivery",
    "SuccessfulDelivery",
  ],
};

// Human-readable labels
const PERMISSION_LABELS = {
  AdminDashboard: "View Admin Dashboard",
  AdminDeliveryDetails: "View Delivery Details",
  AdminViewOrder: "View Orders",
  UpdateOrderModal: "Update Orders",
  RescheduleModal: "Reschedule Orders",
  AdminAddDelivery: "Add Delivery",
  AdminMonitorDelivery: "Monitor Deliveries",
  AdminGenerateReport: "Generate Reports",
  AdminSettings: "Manage Admin Settings",
  SystemAdminRolesAndPermission: "Manage Roles & Permissions",
  UserManagement: "Manage Users",
  CreatePersonnelAccount: "Create Personnel Account",
  RegisterAccount: "Register Account",
  OperationalDelivery: "Manage Operational Delivery",
  PersonnelAccounts: "Manage Personnel Accounts",
  ViewPersonnelModal: "View Personnel Details",
  OperationalSettings: "Manage Operational Settings",
  DriverDashboard: "View Driver Dashboard",
  DriverGuidePage: "View Driver Guide",
  DriverProfileSettings: "Manage Driver Profile Settings",
  FailedDeliveries: "View Failed Deliveries",
  OutForDelivery: "View Out-for-Delivery",
  SuccessfulDelivery: "View Successful Deliveries",
};

// Role labels
const Roles = {
  "data-admin": "Data Admin",
  "staff-admin": "Staff Admin",
  "system-admin": "System Admin",
  "operational-manager": "Operational Manager",
  "delivery-personnel": "Delivery Personnel",
};

// Map role key to ALL_PERMISSIONS key
const getRolePermissionsKey = (role) => {
  if (role.includes("admin")) return "admin";
  if (role === "operational-manager") return "operationalManager";
  if (role === "delivery-personnel") return "deliveryPersonnel";
  return "admin";
};

const SystemAdminRolesAndPermission = () => {
  const { user, setUser } = useContext(UserContext);
  const [activeRole, setActiveRole] = useState("data-admin");
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios
      .post(
        "http://localhost/DeliveryTrackingSystem/get_role_permissions.php",
        { role: activeRole }
      )
      .then((res) => {
        if (res.data.success && res.data.permissions) {
          setPermissions(res.data.permissions);
        } else {
          // Default all permissions to true if not saved
          const allPerms =
            ALL_PERMISSIONS[getRolePermissionsKey(activeRole)] || [];
          const defaultPerms = {};
          allPerms.forEach((p) => (defaultPerms[p] = true));
          setPermissions(defaultPerms);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeRole]);

  const togglePermission = (perm) => {
    const newPermissions = { ...permissions, [perm]: !permissions[perm] };
    setPermissions(newPermissions);

    // Save updated permissions to backend
    axios
      .post(
        "http://localhost/DeliveryTrackingSystem/save_role_permissions.php",
        {
          role: activeRole,
          permissions: newPermissions,
        }
      )
      .then(() => {
        toast.success(`${PERMISSION_LABELS[perm]} updated!`, {
          duration: 1000,
          style: { fontSize: "0.9rem" },
        });

        // If logged-in user is affected, update UserContext
        if (activeRole === user.role) {
          setUser({ ...user, permissions: newPermissions });
          localStorage.setItem(
            "user",
            JSON.stringify({ ...user, permissions: newPermissions })
          );
        }
      })
      .catch(console.error);
  };

  const filteredPermissions =
    ALL_PERMISSIONS[getRolePermissionsKey(activeRole)] || [];

  return (
    <AdminLayout
      title="User Roles and Permissions"
      permissions={user?.permissions}
    >
      <Toaster position="top-right" />
      <div className="container mt-4">
        <Tabs
          activeKey={activeRole}
          onSelect={(k) => setActiveRole(k)}
          className="mb-3 custom-tabs mt-5 gap-2"
          fill
        >
          {Object.entries(Roles).map(([key, label]) => (
            <Tab eventKey={key} title={label} key={key} />
          ))}
        </Tabs>

        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <Table bordered hover responsive className="text-left delivery-table">
            <thead className="table-light">
              <tr>
                <th>Action</th>
                <th className="text-center">Access</th>
              </tr>
            </thead>
            <tbody>
              {filteredPermissions.map((perm) => (
                <tr key={perm}>
                  <td className="p-2">{PERMISSION_LABELS[perm] || perm}</td>
                  <td className="text-center">
                    <Form.Check
                      type="checkbox"
                      checked={permissions[perm] ?? true}
                      onChange={() => togglePermission(perm)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </AdminLayout>
  );
};

export default SystemAdminRolesAndPermission;
