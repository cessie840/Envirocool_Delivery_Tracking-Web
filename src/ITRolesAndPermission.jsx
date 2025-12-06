import React, { useState } from "react";
import { Tabs, Tab, Table, Form } from "react-bootstrap";
import { Toaster } from "sonner";
import ITLayout from "./ITLayout";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const ITRolesAndPermission = () => {
  const [activeTab, setActiveTab] = useState("admin");
  const [currentPage, setCurrentPage] = useState(1);

  const adminAccounts = [
    {
      id: 1,
      username: "systemadmin",
      permissions: {
        "Create Transaction": true,
        "Update Transaction": true,
        "View Deliveries": true,
        "Monitor Deliveries": true,
        "Generate Reports": false,
        "Change Password": false,
        "Create Delivery Account": false,
      },
    },
  ];

  const operationalAccounts = [
    {
      id: 1,
      username: "opmanager1",
      permissions: {
        "Assign Delivery": true,
        "View Delivery Details": true,
        "Create Delivery Account": false,
        "Reschedule Deliverie": true,
        "Change Password": false,
     
      },
    },
  ];

  const deliveryAccounts = [
    {
      id: 1,
      username: "delivery1",
      permissions: {
        "View Assigned Deliveries": true,
        "Update Delivery Status": true,
      },
    },
  ];

  let accounts =
    activeTab === "admin"
      ? adminAccounts
      : activeTab === "operational-manager"
      ? operationalAccounts
      : deliveryAccounts;

  const [currentAccounts, setCurrentAccounts] = useState(accounts);

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


  const allPermissions = Object.keys(currentAccounts[0].permissions);
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
      <ITLayout
        title={
          <div className="d-flex align-items-center gap-2">
            <span>User Roles & Permission</span>
          </div>
        }
      >
        <div className="compact-container container mt-5 pb-5 px-5 rounded-2">
          <Tabs
            id="roles-tabs"
            activeKey={activeTab}
            onSelect={(k) => {
              setActiveTab(k);
              setCurrentPage(1); 
              setCurrentAccounts(
                k === "admin"
                  ? adminAccounts
                  : k === "operational-manager"
                  ? operationalAccounts
                  : deliveryAccounts
              );
            }}
            className="fw-bold custom-tabs mb-4"
          >
            <Tab eventKey="admin" title="Admin" />
            <Tab eventKey="operational-manager" title="Operational Manager" />
            <Tab eventKey="delivery-personnel" title="Delivery Personnel" />
          </Tabs>

          <Table
            bordered
            hover
            responsive
            className="delivery-table container-fluid table-responsive bg-white"
          >
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
                    <td className="text-center" key={perm}>
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

export default ITRolesAndPermission;
