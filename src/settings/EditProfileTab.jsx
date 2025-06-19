import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaUserEdit } from "react-icons/fa";

const EditProfileTab = () => {
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    fname: "",
    lname: "",
    email: "",
    phone: "",
  });
  const [role, setRole] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost/DeliveryTrackingSystem/get_profile.php", {
        withCredentials: true,
      })
      .then((res) => {
        const data = res.data;
        setUserData(data);

        if (data.ad_username) {
          setRole("admin");
          setFormData({
            username: data.ad_username,
            fname: data.ad_fname,
            lname: data.ad_lname,
            email: data.ad_email,
            phone: data.ad_phone,
          });
        } else if (data.manager_username) {
          setRole("operational");
          setFormData({
            username: data.manager_username,
            fname: data.manager_fname,
            lname: data.manager_lname,
            email: data.manager_email,
            phone: data.manager_phone,
          });
        }
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
    const updateUrl =
      role === "admin"
        ? "http://localhost/DeliveryTrackingSystem/update_admin_profile.php"
        : "http://localhost/DeliveryTrackingSystem/update_operational_profile.php";

    const payload =
      role === "admin"
        ? {
            ad_username: formData.username,
            ad_fname: formData.fname,
            ad_lname: formData.lname,
            ad_email: formData.email,
            ad_phone: formData.phone,
          }
        : {
            manager_username: formData.username,
            manager_fname: formData.fname,
            manager_lname: formData.lname,
            manager_email: formData.email,
            manager_phone: formData.phone,
          };

    axios
      .post(updateUrl, JSON.stringify(payload), {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      })
      .then(() => {
        alert("Profile updated successfully.");
        setIsEditing(false);
        window.location.reload(); // optional — removes stale session/view
      })
      .catch((err) => {
        console.error("Update failed:", err);
        alert("Profile update failed.");
      });
  };

  if (!userData) return <p>Loading profile...</p>;

  return (
    <div className="p-4 rounded">
      <h4 className="title">
        <FaUserEdit size={40} className="me-2" /> Edit Profile
      </h4>
      <p>Update your profile here.</p>
      <hr />
      {!isEditing ? (
        <>
          <p>
            <strong>Username:</strong> {formData.username}
          </p>
          <p>
            <strong>First Name:</strong> {formData.fname}
          </p>
          <p>
            <strong>Last Name:</strong> {formData.lname}
          </p>
          <p>
            <strong>Email:</strong> {formData.email}
          </p>
          <p>
            <strong>Phone:</strong> {formData.phone}
          </p>
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
          {["username", "fname", "lname", "email", "phone"].map((field) => (
            <div className="form-group mb-3" key={field}>
              <label className="text-capitalize">{field}</label>
              <input
                type={field === "email" ? "email" : "text"}
                name={field}
                className="form-control"
                value={formData[field]}
                onChange={handleChange}
              />
            </div>
          ))}
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
