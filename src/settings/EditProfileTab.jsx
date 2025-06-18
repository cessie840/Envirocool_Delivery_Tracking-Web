import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaUserEdit } from "react-icons/fa";

const EditProfileTab = () => {
  const [adminData, setAdminData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    ad_username: "",
    ad_fname: "",
    ad_lname: "",
    ad_email: "",
    ad_phone: ""
  });

  useEffect(() => {
    axios
      .get("http://localhost/DeliveryTrackingSystem/get_admin_profile.php", {
        withCredentials: true,
      })
      .then((res) => {
        setAdminData(res.data);
        setFormData(res.data);
      })
      .catch((err) => {
        console.error("Error fetching profile:", err);
        alert("Unable to load profile.");
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = () => {
    axios
      .post(
        "http://localhost/DeliveryTrackingSystem/update_admin_profile.php",
        JSON.stringify(formData),
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      )
      .then(() => {
        alert("Profile updated.");
        setAdminData(formData);
        setIsEditing(false);
      })
      .catch((err) => {
        console.error("Update failed:", err);
        alert("Profile update failed.");
      });
  };

  if (!adminData) return <p>Loading...</p>;

  return (
    <div className="p-4 rounded">
      <h4 className="title">
        <FaUserEdit size={40} className="me-2" /> Edit Profile
      </h4>
      <p>Update your profile here.</p>
      <hr />
      {!isEditing ? (
        <>
          <p><strong>Username:</strong> {adminData.ad_username}</p>
          <p><strong>First Name:</strong> {adminData.ad_fname}</p>
          <p><strong>Last Name:</strong> {adminData.ad_lname}</p>
          <p><strong>Email:</strong> {adminData.ad_email}</p>
          <p><strong>Phone:</strong> {adminData.ad_phone}</p>
          <hr />
          <button
            className="btn btn-view mt-2 px-4"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </button>
        </>
      ) : (
        <>
          <div className="form-group mb-3">
            <label>Username</label>
            <input
              type="text"
              name="ad_username"
              className="form-control"
              value={formData.ad_username}
              onChange={handleChange}
            />
          </div>
          <div className="form-group mb-3">
            <label>First Name</label>
            <input
              type="text"
              name="ad_fname"
              className="form-control"
              value={formData.ad_fname}
              onChange={handleChange}
            />
          </div>
          <div className="form-group mb-3">
            <label>Last Name</label>
            <input
              type="text"
              name="ad_lname"
              className="form-control"
              value={formData.ad_lname}
              onChange={handleChange}
            />
          </div>
          <div className="form-group mb-3">
            <label>Email</label>
            <input
              type="email"
              name="ad_email"
              className="form-control"
              value={formData.ad_email}
              onChange={handleChange}
            />
          </div>
          <div className="form-group mb-3">
            <label>Phone</label>
            <input
              type="text"
              name="ad_phone"
              className="form-control"
              value={formData.ad_phone}
              onChange={handleChange}
            />
          </div>
          <button className="btn add-btn me-2" onClick={handleUpdate}>
            Save
          </button>
          <button
            className="btn cancel-btn bg-secondary"
            onClick={() => setIsEditing(false)}
          >
            Cancel
          </button>
        </>
      )}
    </div>
  );
};

export default EditProfileTab;
