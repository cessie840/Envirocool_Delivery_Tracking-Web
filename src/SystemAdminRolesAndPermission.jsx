import React, { useState, useEffect, useRef } from "react";
import { Tabs, Tab, Table, Form } from "react-bootstrap";
import { Toaster } from "sonner";
import ITLayout from "./SystemAdminLayout";
import axios from "axios";

const SystemAdminRolesAndPermission = () => {
  const [activeTab, setActiveTab] = useState("admin");

  const [adminAccounts, setAdminAccounts] = useState([]);
  const [operationalAccounts, setOperationalAccounts] = useState([]);
  const [deliveryAccounts, setDeliveryAccounts] = useState([]);

  const scrollRef = useRef(null);

  useEffect(() => {
    axios
      .get("http://localhost/DeliveryTrackingSystem/get_all_user.php")
      .then((res) => {
        if (res.data.success) {
          setAdminAccounts(
            res.data.data.admins.map((row, index) => {
              const defaultPerms = {
                "Create Transaction": true,
                "Update Transaction": true,
                "View Deliveries": true,
                "Monitor Deliveries": true,
                "Generate Reports": false,
                "Create Delivery Account": false,
              };
              return {
                id: index + 1,
                username: row.ad_username,
                permissions: row.permissions || defaultPerms,
              };
            })
          );

          setOperationalAccounts(
            res.data.data.managers.map((row, index) => {
              const defaultPerms = {
                "Assign Delivery": true,
                "View Delivery Details": true,
                "Create Delivery Account": false,
                "Reschedule Deliverie": true,
              };
              return {
                id: index + 1,
                username: row.manager_username,
                permissions: row.permissions || defaultPerms,
              };
            })
          );

          setDeliveryAccounts(
            res.data.data.personnel.map((row, index) => {
              const defaultPerms = {
                "View Assigned Deliveries": true,
                "Update Delivery Status": true,
              };
              return {
                id: index + 1,
                username: row.pers_username,
                permissions: row.permissions || defaultPerms,
              };
            })
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
    setCurrentPage(1); 
  }, [accounts, activeTab]);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const totalPages = Math.max(
    1,
    Math.ceil(currentAccounts.length / rowsPerPage)
  );

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const paginatedAccounts = currentAccounts.slice(indexOfFirst, indexOfLast);

  const changePage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handlePermissionChange = async (accountId, permission) => {
    const updatedAccounts = currentAccounts.map((acc) => {
      if (acc.id === accountId) {
        return {
          ...acc,
          permissions: {
            ...acc.permissions,
            [permission]: !acc.permissions[permission],
          },
        };
      }
      return acc;
    });

    setCurrentAccounts(updatedAccounts);

    const changedAccount = updatedAccounts.find((acc) => acc.id === accountId);

    try {
      await axios.post(
        "http://localhost/DeliveryTrackingSystem/save_user_permission.php",
        {
          username: changedAccount.username,
          role: activeTab,
          permissions: changedAccount.permissions,
        }
      );
    } catch (err) {
      console.error("Failed to save permissions:", err);
    }
  };

  const allPermissions =
    currentAccounts.length > 0
      ? Object.keys(currentAccounts[0].permissions)
      : [];

  const formatPermissionName = (perm) =>
    perm
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const tableMinWidth = Math.max(600, allPermissions.length * 160 + 200);

  return (
    <>
      <Toaster position="top-center" richColors />
      <ITLayout title={<span>User Roles & Permission</span>}>
        <div className="compact-container container mt-5 pb-5 px-3 rounded-2">
          <Tabs
            id="roles-tabs"
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="fw-bold custom-tabs mb-4"
          >
            <Tab eventKey="admin" title="Admin" />
            <Tab eventKey="operational-manager" title="Operational Manager" />
            <Tab eventKey="delivery-personnel" title="Delivery Personnel" />
          </Tabs>

          <div className="inner-container">
            <div
              ref={scrollRef}
              className="scroll-area"
              style={{
                overflowX: "auto",
                scrollBehavior: "smooth",
                paddingBottom: 8,
              }}
            >
              <Table
                bordered
                hover
                responsive
                className="delivery-table bg-white"
                style={{
                  minWidth: tableMinWidth,
                  fontSize: 14,
                  whiteSpace: "nowrap",
                  tableLayout: "auto",
                }}
              >
                <thead>
                  <tr>
                    <th style={{ minWidth: 200 }}>Accounts</th>
                    {allPermissions.map((perm) => (
                      <th key={perm} style={{ minWidth: 160 }}>
                        {formatPermissionName(perm)}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {paginatedAccounts.map((account) => (
                    <tr key={account.id} className="account-row">
                      <td style={{ minWidth: 200 }}>
                        <div className="cell-content">{account.username}</div>
                      </td>

                      {allPermissions.map((perm) => (
                        <td
                          key={perm}
                          className="text-center"
                          style={{ minWidth: 160 }}
                        >
                          <div className="cell-content">
                            <Form.Check
                              type="checkbox"
                              checked={!!account.permissions[perm]}
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
            </div>

            <div className="custom-pagination mt-3">
              <button
                className="page-btn"
                disabled={currentPage === 1}
                onClick={() => changePage(currentPage - 1)}
              >
                ‹
              </button>

              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>

              <button
                className="page-btn"
                disabled={currentPage === totalPages}
                onClick={() => changePage(currentPage + 1)}
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </ITLayout>
    </>
  );
};

export default SystemAdminRolesAndPermission;
