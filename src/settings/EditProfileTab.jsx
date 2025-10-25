import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaUserEdit } from "react-icons/fa";
import Swal from "sweetalert2";
import { Toaster, toast } from "sonner";

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
  const [errors, setErrors] = useState({});
  const [valid, setValid] = useState({});
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(
          "http://localhost/DeliveryTrackingSystem/get_profile.php",
          { withCredentials: true }
        );
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
      } catch (error) {
        console.error("Error fetching profile:", error);
        setErrors({
          general:
            "Unable to load profile. Please check your connection and try logging in again.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const validateFieldSync = (name, value) => {
    const trimmedValue = (value || "").trim();
    let message = "";
    let isValid = false;

    switch (name) {
      case "username":
        if (!trimmedValue) message = "Username is required.";
        else isValid = true;
        break;
      case "fname":
        if (!trimmedValue) message = "First name is required.";
        else if (!/^[A-Za-zñÑ\s]+$/.test(trimmedValue))
          message = "Only letters and spaces are allowed.";
        else isValid = true;
        break;
      case "lname":
        if (!trimmedValue) message = "Last name is required.";
        else if (!/^[A-Za-zñÑ\s]+$/.test(trimmedValue))
          message = "Only letters and spaces are allowed.";
        else isValid = true;
        break;
      case "email":
        if (!trimmedValue) message = "Email is required.";
        else if (
          !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(com|net|org|edu|gov|ph|io)$/.test(
            trimmedValue
          )
        )
          message = "Invalid email format. Example: user@example.com";
        else isValid = true;
        break;
      case "phone":
        if (!trimmedValue) {
          message = "Phone number is required.";
        } else if (!/^09\d{9}$/.test(trimmedValue)) {
          if (!/^09/.test(trimmedValue)) {
            message = "Phone number must start with 09.";
          } else if (trimmedValue.length !== 11) {
            message = "Phone number must be exactly 11 digits long.";
          } else {
            message = "Invalid phone number format.";
          }
        } else {
          isValid = true;
        }
        break;
    }

    return { message, isValid };
  };

  const validateAllSync = (data) => {
    const newErrors = {};
    const newValid = {};
    Object.keys(data).forEach((key) => {
      const { message, isValid } = validateFieldSync(key, data[key]);
      if (message) newErrors[key] = message;
      newValid[key] = isValid;
    });
    return { newErrors, newValid };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let cleanValue = value;

    if (name === "fname" || name === "lname") {
      cleanValue = value.replace(/[^A-Za-zñÑ\s]/g, "");
      if (value !== cleanValue) {
        setErrors((prev) => ({
          ...prev,
          [name]: "Only letters and spaces are allowed.",
        }));
        setValid((prev) => ({ ...prev, [name]: false }));
      } else {
        const { message, isValid } = validateFieldSync(name, cleanValue);
        setErrors((prev) => ({ ...prev, [name]: message }));
        setValid((prev) => ({ ...prev, [name]: isValid }));
      }
    } else if (name === "phone") {
      cleanValue = value.replace(/[^0-9]/g, "");
      if (value !== cleanValue) {
        setErrors((prev) => ({ ...prev, [name]: "Only numbers are allowed." }));
        setValid((prev) => ({ ...prev, [name]: false }));
      } else {
        const { message, isValid } = validateFieldSync(name, cleanValue);
        setErrors((prev) => ({ ...prev, [name]: message }));
        setValid((prev) => ({ ...prev, [name]: isValid }));
      }
    } else if (name === "email") {
      cleanValue = value.replace(/[^A-Za-z0-9@._%+-]/g, "");
      const { message, isValid } = validateFieldSync(name, cleanValue);
      setErrors((prev) => ({ ...prev, [name]: message }));
      setValid((prev) => ({ ...prev, [name]: isValid }));
    } else {
      const { message, isValid } = validateFieldSync(name, cleanValue);
      setErrors((prev) => ({ ...prev, [name]: message }));
      setValid((prev) => ({ ...prev, [name]: isValid }));
    }

    setFormData((prev) => ({ ...prev, [name]: cleanValue }));
  };

  const handleUpdate = async () => {
    const confirm = await Swal.fire({
      title: "Save Changes?",
      text: "Do you want to save the changes to your profile?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#288B44FF",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, save it",
    });

    if (!confirm.isConfirmed) return;

    setErrors((prev) => ({ ...prev, general: "" }));

    const { newErrors, newValid } = validateAllSync(formData);
    setErrors((prev) => ({ ...prev, ...newErrors }));
    setValid((prev) => ({ ...prev, ...newValid }));

    const hasError = Object.values(newValid).some((v) => v !== true);
    if (hasError) {
      setErrors((prev) => ({
        ...prev,
        general: "Ensure all fields are valid before saving.",
      }));
      return;
    }

    setUpdateLoading(true);
    let updateUrl = "";
    let payload = {};

    switch (role) {
      case "admin":
        updateUrl =
          "http://localhost/DeliveryTrackingSystem/update_admin_profile.php";
        payload = {
          ad_username: formData.username.trim(),
          ad_fname: formData.fname.trim(),
          ad_lname: formData.lname.trim(),
          ad_email: formData.email.trim(),
          ad_phone: formData.phone.trim(),
        };
        break;
      case "manager":
        updateUrl =
          "http://localhost/DeliveryTrackingSystem/update_operational_profile.php";
        payload = {
          manager_username: formData.username.trim(),
          manager_fname: formData.fname.trim(),
          manager_lname: formData.lname.trim(),
          manager_email: formData.email.trim(),
          manager_phone: formData.phone.trim(),
        };
        break;
      case "personnel":
        updateUrl =
          "http://localhost/DeliveryTrackingSystem/update_personnel_profile.php";
        payload = {
          pers_username: formData.username.trim(),
          pers_fname: formData.fname.trim(),
          pers_lname: formData.lname.trim(),
          pers_email: formData.email.trim(),
          pers_phone: formData.phone.trim(),
        };
        break;
    }

    try {
      const res = await axios.post(updateUrl, JSON.stringify(payload), {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });

      if (res.data.success) {
        toast.success("Profile updated successfully!", {
          duration: 2500,
          style: {
            background: "#DEF1E0FF",
            border: "1px solid #77BB79FF",
            color: "#2E7D32",
            fontWeight: 600,
            fontSize: "1.1rem",
            textAlign: "center",
            width: "100%",
            maxWidth: "600px",
            margin: "0 auto",
            justifyContent: "center",
          },
        });
        setIsEditing(false);
      } else {
        setErrors((prev) => ({
          ...prev,
          general: res.data.message || "Update failed. Please try again.",
        }));
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrors((prev) => ({
        ...prev,
        general:
          "Server or network error. Please check your connection and try again.",
      }));
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) return <p>Loading profile...</p>;

  const labels = {
    username: "Username",
    fname: "First Name",
    lname: "Last Name",
    email: "Email",
    phone: "Phone",
  };

  return (
    <div className="p-4 rounded position-relative">
      <Toaster position="top-center" richColors />

      <h4 className="title mb-1">
        <FaUserEdit size={40} className="me-2" /> Edit Profile
      </h4>
      <p>Update your profile here.</p>
      <hr />

      {errors.general && (
        <div
          className="alert alert-danger mb-3"
          style={{
            fontSize: "1rem",
            padding: "10px 12px",
            borderRadius: "6px",
          }}
        >
          {errors.general}
        </div>
      )}

      {!isEditing ? (
        <>
          {Object.keys(labels).map((field) => (
            <p key={field}>
              <strong>{labels[field]}:</strong> {formData[field]}
            </p>
          ))}
          <hr />
          <button
            className="btn btn-view mt-2 px-5 py-2 fs-6 rounded-2"
            onClick={() => setIsEditing(true)}
            disabled={updateLoading}
          >
            Edit
          </button>
        </>
      ) : (
        <>
          {Object.keys(labels).map((field) => (
            <div className="form-group mb-3" key={field}>
              <label>
                {labels[field]} <span className="text-danger">*</span>
              </label>
              <input
                type={field === "email" ? "email" : "text"}
                name={field}
                className={`form-control ${
                  errors[field]
                    ? "is-invalid border-danger"
                    : valid[field]
                    ? "is-valid border-success"
                    : ""
                }`}
                value={formData[field]}
                onChange={handleChange}
                disabled={updateLoading}
              />
              {errors[field] && (
                <div className="text-danger small mt-1">{errors[field]}</div>
              )}
            </div>
          ))}

          <button
            className="btn add-btn px-4 py-2 fs-6 rounded-2 me-4"
            onClick={handleUpdate}
            disabled={updateLoading}
          >
            {updateLoading ? "Saving..." : "Save"}
          </button>
          <button
            className="btn cancel-btn px-4 py-2 fs-6 rounded-2 bg-secondary"
            onClick={() => setIsEditing(false)}
            disabled={updateLoading}
          >
            Cancel
          </button>
        </>
      )}
    </div>
  );
};

export default EditProfileTab;
