import React, { useState, useEffect } from "react";
import { Tabs, Tab, Table, Form } from "react-bootstrap";
import { Toaster } from "sonner";
import ITLayout from "./SystemAdminLayout";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import axios from "axios";

const SystemAdminRolesAndPermission = () => {
  const [activeTab, setActiveTab] = useState("admin");
  const [currentPage, setCurrentPage] = useState(1);

  // 🔥 fetched data state
  const [adminAccounts, setAdminAccounts] = useState([]);
  const [operationalAccounts, setOperationalAccounts] = useState([]);
  const [deliveryAccounts, setDeliveryAccounts] = useState([]);

  // FETCH FROM BACKEND -------------------------------------------------------
  useEffect(() => {
    axios
      .get("http://localhost/DeliveryTrackingSystem/get_all_user.php")
      .then((res) => {
        if (res.data.success) {
          // Convert fetched usernames into your SAME structure
          setAdminAccounts(
            res.data.data.admins.map((row, index) => ({
              id: index + 1,
              username: row.ad_username,
              permissions: {
                "Create Transaction": true,
                "Update Transaction": true,
                "View Deliveries": true,
                "Monitor Deliveries": true,
                "Generate Reports": false,
                "Change Password": false,
                "Create Delivery Account": false,
              },
            }))
          );

          setOperationalAccounts(
            res.data.data.managers.map((row, index) => ({
              id: index + 1,
              username: row.manager_username,
              permissions: {
                "Assign Delivery": true,
                "View Delivery Details": true,
                "Create Delivery Account": false,
                "Reschedule Deliverie": true,
                "Change Password": false,
              },
            }))
          );

          setDeliveryAccounts(
            res.data.data.personnel.map((row, index) => ({
              id: index + 1,
              username: row.pers_username,
              permissions: {
                "View Assigned Deliveries": true,
                "Update Delivery Status": true,
              },
            }))
          );
        }
      })
      .catch((err) => console.log(err));
  }, []);

 
  let accounts =
    activeTab === "admin"
      ? adminAccounts
      : activeTab === "operational-manager"
      ? operationalAccounts
      : deliveryAccounts;

  const [currentAccounts, setCurrentAccounts] = useState([]);


  useEffect(() => {
    setCurrentAccounts(accounts);
  }, [accounts, activeTab]);


  const handlePermissionChange = (accountId, permission) => {
    setCurrentAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId
          ? {
              ...acc,
              permissions: {
                ...acc.permissions,
                [permission]: !acc.permissions[permission],
              },
            }
          : acc
      )
    );
  };

  
  const allPermissions =
    currentAccounts.length > 0
      ? Object.keys(currentAccounts[0].permissions)
      : [];

  const permsPerPage = 4;
  const totalPages = Math.ceil(allPermissions.length / permsPerPage);

  const indexOfLast = currentPage * permsPerPage;
  const indexOfFirst = indexOfLast - permsPerPage;
  const currentPermissions = allPermissions.slice(indexOfFirst, indexOfLast);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const formatPermissionName = (perm) =>
    perm
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  return (
    <>
      <Toaster position="top-center" richColors />
      <ITLayout title={<span>User Roles & Permission</span>}>
        <div className="compact-container container mt-5 pb-5 px-5 rounded-2">
          <Tabs
            id="roles-tabs"
            activeKey={activeTab}
            onSelect={(k) => {
              setActiveTab(k);
              setCurrentPage(1);
            }}
            className="fw-bold custom-tabs mb-4"
          >
            <Tab eventKey="admin" title="Admin" />
            <Tab eventKey="operational-manager" title="Operational Manager" />
            <Tab eventKey="delivery-personnel" title="Delivery Personnel" />
          </Tabs>

          <Table bordered hover responsive className="delivery-table bg-white">
            <thead>
              <tr>
                <th>Accounts</th>
                {currentPermissions.map((perm) => (
                  <th key={perm}>{formatPermissionName(perm)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentAccounts.map((account) => (
                <tr key={account.id} className="account-row">
                  <td>
                    <div className="cell-content">{account.username}</div>
                  </td>
                  {currentPermissions.map((perm) => (
                    <td key={perm} className="text-center">
                      <div className="cell-content">
                        <Form.Check
                          type="checkbox"
                          checked={account.permissions[perm]}
                          onChange={() =>
                            handlePermissionChange(account.id, perm)
                          }
                          className="big-checkbox"
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>

          {totalPages > 1 && (
            <div className="d-flex justify-content-center align-items-center mt-3 gap-2">
              <FaChevronLeft
                size={20}
                style={{
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                }}
                color={currentPage === 1 ? "#ccc" : "#000"}
                onClick={handlePrevPage}
              />

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <FaChevronRight
                size={20}
                style={{
                  cursor:
                    currentPage === totalPages ? "not-allowed" : "pointer",
                }}
                color={currentPage === totalPages ? "#ccc" : "#000"}
                onClick={handleNextPage}
              />
            </div>
          )}
        </div>
      </ITLayout>
    </>
  );
};

export default SystemAdminRolesAndPermission;
