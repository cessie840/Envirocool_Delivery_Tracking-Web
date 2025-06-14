import React, { useEffect, useState } from "react";
import OperationalLayout from "./OperationalLayout";
import { useNavigate } from "react-router-dom";
import {  FaUserPlus } from "react-icons/fa";

const PersonnelAccounts = () => {
  const navigate = useNavigate();
  const [personnel, setPersonnel] = useState([]);

  useEffect(() => {
    document.title = "Delivery Personnel Accounts";

    const sampleData = [
      {
        id: 1,
        pers_fname: "Kuro",
        pers_lname: "The Cat",
        pers_username: "kurothecat",
        pers_password: "ilovecatfood",
        pers_email: "kuro.thecat@example.com",
      },
    ];

    setPersonnel(sampleData);
  }, []);

  const handleEdit = (id) => {
    alert(`Edit delivery personnel with ID: ${id}`);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this account?")) {
      alert(`Deleted delivery personnel with ID: ${id}`);
    }
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
              <th>Password</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {personnel.length > 0 ? (
              personnel.map((person) => (
                <tr key={person.id}>
                  <td>
                    {person.pers_fname} {person.pers_lname}
                  </td>
                  <td>{person.pers_email}</td>
                  <td>{person.pers_username}</td>
                  <td>{person.pers_password}</td>
                  <td>
                    <button id="personnel-view"
                      className="btn btn-view btn-success me-2"
                      onClick={() => handleEdit(person.id)}
                    >
                      Edit
                    </button>
                    <button id="personnel-cancel"
                      className="btn cancel-btn btn-danger"
                      onClick={() => handleDelete(person.id)}
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
    </OperationalLayout>
  );
};

export default PersonnelAccounts;
