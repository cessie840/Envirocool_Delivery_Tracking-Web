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
          status: p.status || "Inactive",
          assignment_status: p.assignment_status || "Inactive",
        }));
        setPersonnel(dataWithStatus);
      })
      .catch((error) => {
        console.error("Error fetching personnel:", error);
      });
  };

  const handleToggleStatus = (username, currentStatus, assignmentStatus) => {
    // 🚫 Restrict toggling if Out for Delivery
    if (assignmentStatus === "Out for Delivery") {
      alert("Cannot set personnel to Inactive while Out for Delivery.");
      return;
    }

    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";

    // Update UI immediately
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
        } else {
          alert(response.data.message);
          fetchPersonnel(); // refresh if backend rejected toggle
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

                {/* Status Column */}
<td
  className={`text-center fw-bold ${
    person.assignment_status?.trim().toLowerCase() === "available"
      ? "text-success"
      : person.assignment_status?.trim().toLowerCase() === "out for delivery"
      ? "text-success" // ✅ force Out for Delivery to green
      : "text-danger"
  }`}
>
  {person.assignment_status}
</td>

{/* Toggle Column */}
<td className="text-center">
  <div className="d-flex flex-column align-items-center">
    <div
      onClick={() => {
        // ✅ block toggle completely if Out for Delivery
        if (person.assignment_status?.trim().toLowerCase() === "out for delivery") {
          alert("Cannot change status while personnel is Out for Delivery.");
          return;
        }
        handleToggleStatus(
          person.pers_username,
          person.status,
          person.assignment_status
        );
      }}
      style={{
        cursor:
          person.assignment_status?.trim().toLowerCase() === "out for delivery"
            ? "not-allowed"
            : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent:
          person.status === "Active" ? "flex-end" : "flex-start",
        width: "60px",
        height: "28px",
        borderRadius: "20px",
        backgroundColor: person.status === "Active" ? "green" : "red",
        padding: "0 6px",
        opacity:
          person.assignment_status?.trim().toLowerCase() === "out for delivery"
            ? 0.5
            : 1, // fade toggle if disabled
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
