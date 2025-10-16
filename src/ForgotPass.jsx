import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "./assets/envirocool-logo.png";
import "bootstrap/dist/css/bootstrap.min.css";

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validation, setValidation] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false,
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Step 1: Send reset code
  const handleEmail = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost/DeliveryTrackingSystem/forgot_password.php",
        { email }
      );

      const data = response.data;
      console.log("Response from PHP:", data);

      switch (data.status) {
        case "success":
          alert("Reset code has been sent to your email.");
          setStep(2);
          break;
        case "user_not_found":
          setErrorMessage("Email not found.");
          break;
        case "invalid_email":
          setErrorMessage("Invalid email format.");
          break;
        case "email_failed":
          setErrorMessage("Failed to send reset email. Try again.");
          break;
        case "locked":
          setErrorMessage(data.message);
          setTimeout(() => navigate("/"), 3000);
          break;
        case "db_error":
          alert("Something went wrong. Try again later.");
          break;
        default:
          alert("Unexpected error occurred.");
          console.warn("Unhandled status:", data.status);
          break;
      }
    } catch (error) {
      console.error("Axios error:", error);
      setErrorMessage("Server connection failed.");
    }
  };

  // Step 2: Verify code
  const handleVerifyCode = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost/DeliveryTrackingSystem/verify_reset_code.php",
        { email, code }
      );

      const data = response.data;
      console.log("Verify response:", data);

      switch (data.status) {
        case "verified":
          setStep(3);
          break;
        case "expired":
          setErrorMessage("The code has expired. Please request a new one.");
          setStep(1);
          break;
        case "invalid_code":
          setErrorMessage(data.message);
          break;
        case "locked":
          setErrorMessage(data.message);
          setTimeout(() => navigate("/"), 3000);
          break;
        case "not_found":
          setErrorMessage("Email not found. Try again.");
          setStep(1);
          break;
        default:
          setErrorMessage("An unexpected error occurred.");
          break;
      }
    } catch (error) {
      console.error("Verification error:", error);
      alert("Failed to verify code. Please try again.");
    }
  };

  // Step 3: Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    const valid =
      newPassword.length >= 6 &&
      /[A-Z]/.test(newPassword) &&
      /\d/.test(newPassword) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!valid) {
      setErrorMessage("Password does not meet strength requirements.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost/DeliveryTrackingSystem/change_password.php",
        { email, newPassword }
      );

      const data = response.data;
      console.log("Reset response:", data);

      if (data.status === "success") {
        alert("Password has been changed successfully.");
        navigate("/");
      } else {
        setErrorMessage(data.message || "Failed to reset password.");
      }
    } catch (error) {
      console.error("Reset error:", error);
      alert("Server error. Try again later.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card text-center">
        <img
          src={logo}
          alt="EnviroCool Logo"
          className="login-logo img-fluid mb-4"
          width="300"
        />

        <h4 className="mb-4">Reset Password</h4>

        {/* Step 1: Enter Email */}
        {step === 1 && (
          <form className="login-form text-start" onSubmit={handleEmail}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Enter your email address:
              </label>
              <input
                type="email"
                id="email"
                className="form-control"
                placeholder="driver@envirocool.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {errorMessage && (
              <div className="text-danger mb-3 text-center fw-bold">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              className="btn login-btn w-100 rounded-3 fs-5 p-2"
            >
              Send Reset Code
            </button>
          </form>
        )}

        {/* Step 2: Verify Code */}
        {step === 2 && (
          <form className="login-form text-start" onSubmit={handleVerifyCode}>
            <div className="mb-3">
              <label htmlFor="code" className="form-label">
                Enter the 6-digit code sent to your email:
              </label>
              <input
                type="text"
                id="code"
                className="form-control"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            {errorMessage && (
              <div className="text-danger mb-3 text-center fw-bold">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              className="btn login-btn w-100 rounded-3 fs-5 p-2"
            >
              Verify Code
            </button>
          </form>
        )}

        {/* Step 3: Reset Password */}
        {step === 3 && (
          <form
            className="login-form text-start"
            onSubmit={handleChangePassword}
          >
            <div className="mb-3">
              <label htmlFor="newPassword" className="form-label">
                New Password:
              </label>
              <input
                type="password"
                id="newPassword"
                className="form-control"
                name="newPassword"
                value={newPassword}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewPassword(value);
                  setValidation({
                    length: value.length >= 6,
                    uppercase: /[A-Z]/.test(value),
                    number: /\d/.test(value),
                    special: /[!@#$%^&*(),.?":{}|<>]/.test(value),
                  });
                }}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm New Password:
              </label>
              <input
                type="password"
                id="confirmPassword"
                className="form-control"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {/* ✅ Password requirements moved below confirm password */}
        <div className="mt-2" style={{ fontSize: "0.45rem", marginBottom: "8px" }}>
              <p
                style={{
                  color: validation.length ? "green" : "#8B0000",
                  margin: 0,
                }}
              >
                • At least 6 characters
              </p>
              <p
                style={{
                  color: validation.uppercase ? "green" : "#8B0000",
                  margin: 0,
                }}
              >
                • Contains at least one uppercase letter
              </p>
              <p
                style={{
                  color: validation.number ? "green" : "#8B0000",
                  margin: 0,
                }}
              >
                • Contains at least one number
              </p>
              <p
                style={{
                  color: validation.special ? "green" : "#8B0000",
                  margin: 0,
                }}
              >
                • Contains at least one special character (! @ # $ % ^ & * ( ) ,
                . ? " : {"{"} {"}"} | &lt; &gt;)
              </p>
            </div>

            {errorMessage && (
              <div className="text-danger mb-3 text-center fw-bold">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              className="btn login-btn w-100 rounded-3 fs-5 p-2"
            >
              Reset Password
            </button>
          </form>
        )}

        <div className="mt-4">
          <button
            className="btn btn-link small fw-semibold"
            type="button"
            onClick={() => navigate("/")}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
