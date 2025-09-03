import React, { useEffect, useState } from "react";
import OperationalLayout from "./OperationalLayout";
import ViewPersonnelModal from "./ViewPersonnelModal";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUserPlus, FaEye, FaEyeSlash } from "react-icons/fa";

const PersonnelAccounts = () => {
  const navigate = useNavigate();
  const [personnel, setPersonnel] = useState([]);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    document.title = "Delivery Personnel Accounts";

    axios
      .get(
        "http://localhost/DeliveryTrackingSystem/display_delivery_personnel.php"
      )
      .then((response) => {
        setPersonnel(response.data);
      })
      .catch((error) => {
        console.error("Error fetching personnel:", error);
      });
  }, []);

  const handleDelete = async (username) => {
    if (!window.confirm("Are you sure you want to delete this account?"))
      return;

    try {
      const response = await axios.post(
        "http://localhost/DeliveryTrackingSystem/delete_delivery_personnel.php",
        { username }
      );

      if (response.data.status === "success") {
        alert("Account deleted successfully.");
        setPersonnel((prev) =>
          prev.filter((p) => p.pers_username !== username)
        );
      } else {
        alert(response.data.message || "Failed to delete the account.");
      }
    } catch (error) {
      console.error("Deletion error:", error);
      alert("An error occurred while deleting the account.");
    }
  };

  const togglePasswordVisibility = (username) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [username]: !prev[username],
    }));
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

      <div className="delivery-table table-responsive">
        <table className="table table-bordered text-center">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email</th>
              <th>Username</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {personnel.length > 0 ? (
              personnel.map((person) => (
                <tr key={person.pers_username}>
                  <td>
                    {person.pers_fname} {person.pers_lname}
                  </td>
                  <td>{person.pers_email}</td>
                  <td>{person.pers_username}</td>
              
                  <td>
                    <button
                      id="personnel-view"
                      className="btn btn-view me-2"
                      onClick={() => {
                        setSelectedUser(person.pers_username);
                        setShowModal(true);
                      }}
                    >
                      View
                    </button>
                    <button
                      id="personnel-cancel"
                      className="btn cancel-btn btn-danger"
                      onClick={() => handleDelete(person.pers_username)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No delivery personnel accounts found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ViewPersonnelModal
        show={showModal}
        onHide={() => setShowModal(false)}
        username={selectedUser}
      />
    </OperationalLayout>
  );
};

export default PersonnelAccounts;
