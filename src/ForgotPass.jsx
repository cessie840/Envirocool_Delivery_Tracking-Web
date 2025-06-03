import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import logo from "./assets/envirocool-logo.png";
import "bootstrap/dist/css/bootstrap.min.css";

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

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

        {step === 1 && (
          <form className="login-form text-start" onSubmit={e => { e.preventDefault(); setStep(2); }}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Enter your email address:</label>
              <input
                type="email"
                id="email"
                className="form-control"
                placeholder="driver@envirocool.com"
                required
              />
            </div>
            <button type="submit" className="btn login-btn w-100 rounded-3 fs-5 p-2">
              Send Reset Code
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="login-form text-start" onSubmit={e => { e.preventDefault(); setStep(3); }}>
            <div className="mb-3">
              <label htmlFor="code" className="form-label">Enter the 6-digit code sent to your email:</label>
              <input
                type="text"
                id="code"
                className="form-control"
                maxLength={6}
                required
              />
            </div>
            <button type="submit" className="btn login-btn w-100 rounded-3 fs-5 p-2">
              Verify Code
            </button>
          </form>
        )}

        {step === 3 && (
          <form className="login-form text-start" onSubmit={e => { e.preventDefault(); alert('Password reset!'); navigate('/'); }}>
            <div className="mb-3">
              <label htmlFor="newPassword" className="form-label">New Password:</label>
              <input
                type="password"
                id="newPassword"
                className="form-control"
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="confirmPassword" className="form-label">Confirm New Password:</label>
              <input
                type="password"
                id="confirmPassword"
                className="form-control"
                required
              />
            </div>
            <button type="submit" className="btn login-btn w-100 rounded-3 fs-5 p-2">
              Reset Password
            </button>
          </form>
        )}

        <div className="mt-4">
          <button className="btn btn-link small fw-semibold" type="button" onClick={() => navigate("/")}>
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
