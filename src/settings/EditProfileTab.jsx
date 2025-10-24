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
        withCredentials: true, // ✅ send PHP session
      })
      .then((res) => {
        const data = res.data;
        setUserData(data);

        // Determine role and set formData accordingly
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
          setRole("manager");
          setFormData({
            username: data.manager_username,
            fname: data.manager_fname,
            lname: data.manager_lname,
            email: data.manager_email,
            phone: data.manager_phone,
          });
        } else if (data.pers_username) {
          setRole("personnel");
          setFormData({
            username: data.pers_username,
            fname: data.pers_fname,
            lname: data.pers_lname,
            email: data.pers_email,
            phone: data.pers_phone,
          });
        } else {
          throw new Error("No valid session found");
        }
      })
      .catch((err) => {
        console.error("Error fetching profile:", err);
        alert("Unable to load profile. Please login again.");
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = () => {
    let updateUrl = "";
    let payload = {};

    switch (role) {
      case "admin":
        updateUrl =
          "http://localhost/DeliveryTrackingSystem/update_admin_profile.php";
        payload = {
          ad_username: formData.username,
          ad_fname: formData.fname,
          ad_lname: formData.lname,
          ad_email: formData.email,
          ad_phone: formData.phone,
        };
        break;
      case "manager":
        updateUrl =
          "http://localhost/DeliveryTrackingSystem/update_operational_profile.php";
        payload = {
          manager_username: formData.username,
          manager_fname: formData.fname,
          manager_lname: formData.lname,
          manager_email: formData.email,
          manager_phone: formData.phone,
        };
        break;
      case "personnel":
        updateUrl =
          "http://localhost/DeliveryTrackingSystem/update_personnel_profile.php";
        payload = {
          pers_username: formData.username,
          pers_fname: formData.fname,
          pers_lname: formData.lname,
          pers_email: formData.email,
          pers_phone: formData.phone,
        };
        break;
      default:
        alert("Unknown role. Cannot update profile.");
        return;
    }

    axios
      .post(updateUrl, payload, {
        withCredentials: true, // ✅ send PHP session
        headers: { "Content-Type": "application/json" },
      })
      .then(() => {
        alert("Profile updated successfully.");
        setIsEditing(false);
        window.location.reload(); // optional
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
            className="btn btn-view mt-2 px-5 py-2 fs-6 rounded-2"
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
          <button
            className="btn add-btn px-4 py-2 fs-6 rounded-2 me-4"
            onClick={handleUpdate}
          >
            Save
          </button>
          <button
            className="btn cancel-btn px-4 py-2 fs-6 rounded-2 bg-secondary"
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
