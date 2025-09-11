import React, { useEffect, useState } from "react";
import OperationalLayout from "./OperationalLayout";
import ViewPersonnelModal from "./ViewPersonnelModal";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUserPlus, FaCheck, FaTimes } from "react-icons/fa";
import { Table } from "react-bootstrap";

const PersonnelAccounts = () => {
  const navigate = useNavigate();
  const [personnel, setPersonnel] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    document.title = "Delivery Personnel Accounts";
    fetchPersonnel();
  }, []);

  const fetchPersonnel = () => {
    axios
      .get(
        "http://localhost/DeliveryTrackingSystem/display_delivery_personnel.php"
      )
      .then((response) => {
        const dataWithStatus = response.data.map((p) => ({
          ...p,
          status: p.status || "Inactive", // keep main status
          assignment_status: p.assignment_status || "Inactive", // add assignment status
        }));
        setPersonnel(dataWithStatus);
      })
      .catch((error) => {
        console.error("Error fetching personnel:", error);
      });
  };

  const handleToggleStatus = (username, currentStatus) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";

    // Update UI immediately (temporary)
    setPersonnel((prev) =>
      prev.map((p) =>
        p.pers_username === username
          ? {
              ...p,
              status: newStatus,
              assignment_status:
                newStatus === "Inactive"
                  ? "Inactive"
                  : p.assignment_status || "Available",
            }
          : p
      )
    );

    // Send request to backend
    axios
      .post(
        "http://localhost/DeliveryTrackingSystem/update_personnel_status.php",
        {
          username,
          status: newStatus,
        }
      )
      .then((response) => {
        if (response.data.success) {
          setPersonnel((prev) =>
            prev.map((p) =>
              p.pers_username === username
                ? {
                    ...p,
                    status: newStatus,
                    assignment_status:
                      newStatus === "Inactive"
                        ? "Inactive"
                        : response.data.assignment_status || "Available",
                  }
                : p
            )
          );
        }
      })
      .catch((error) => {
        console.error("Error updating status:", error);
      });
  };

  return (
    <OperationalLayout title="Delivery Personnel Accounts">
      <div className="d-flex justify-content-end mx-4 my-5">
        <button
          className="add-delivery rounded-3 px-4 py-2 d-flex align-items-center gap-2"
          onClick={() => navigate("/create-personnel-account")}
        >
          <FaUserPlus /> Create Account
        </button>
      </div>

      <Table
        bordered
        hover
        responsive
        className="delivery-table container-fluid table-responsive bg-white"
      >
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Email</th>
            <th>Username</th>
            <th>Status</th>
            <th>Active</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody className="p-2">
          {personnel.length > 0 ? (
            personnel.map((person) => (
              <tr key={person.pers_username}>
                {/* Full Name */}
                <td>
                  {person.pers_fname} {person.pers_lname}
                </td>
                <td>{person.pers_email}</td>
                <td>{person.pers_username}</td>

                {/* Status Column (Available, Out for Delivery, Inactive) */}
                <td
                  className={`text-center fw-bold ${
                    person.assignment_status === "Available"
                      ? "text-success"
                      : person.assignment_status === "Out for Delivery"
                      ? "text-warning"
                      : "text-danger"
                  }`}
                >
                  {person.assignment_status}
                </td>

                {/* Toggle Column (bar style) */}
                <td className="text-center">
                  <div className="d-flex flex-column align-items-center">
                    <div
                      onClick={() =>
                        handleToggleStatus(person.pers_username, person.status)
                      }
                      style={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                          person.status === "Active"
                            ? "flex-end"
                            : "flex-start",
                        width: "60px",
                        height: "28px",
                        borderRadius: "20px",
                        backgroundColor:
                          person.status === "Active" ? "green" : "red",
                        padding: "0 6px",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <span
                        style={{
                          background: "white",
                          borderRadius: "50%",
                          width: "22px",
                          height: "22px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          color: person.status === "Active" ? "green" : "red",
                          fontWeight: "bold",
                          transition: "all 0.3s ease",
                        }}
                      >
                        {person.status === "Active" ? <FaCheck /> : <FaTimes />}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Action Column */}
                <td className="action-btn p-2 d-flex gap-2 align-items-center justify-content-center">
                  <button
                    id="personnel-view"
                    className="btn btn-view"
                    onClick={() => {
                      setSelectedUser(person.pers_username);
                      setShowModal(true);
                    }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center">
                No delivery personnel accounts found.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      <ViewPersonnelModal
        show={showModal}
        onHide={() => setShowModal(false)}
        username={selectedUser}
      />
    </OperationalLayout>
  );
};

export default PersonnelAccounts;
