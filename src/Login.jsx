import React from "react";
import logo from "./assets/envirocool-logo.png";
import "bootstrap/dist/css/bootstrap.min.css";

const Login = () => {
  return (
    <div className="login-container container-fluid">
      <div className="login-card text-center container-fluid">
        <img
          src={logo}
          alt="EnviroCool Logo"
          className="login-logo img-fluid mb-4"
          width="300"
        />

        <form className="login-form text-start">
          <div className="mb-3">
            <label htmlFor="username" className="form-label">
              Username:
            </label>
            <input type="text" id="username" className="form-control" />
          </div>

          <div className="mb-1">
            <label htmlFor="password" className="form-label">
              Password:
            </label>
            <input type="password" id="password" className="form-control" />
          </div>

          <div className="mb-5">
            <a href="#" className="small fw-semibold">
              Forgot password?
            </a>
          </div>

          <button type="submit" className="btn login-btn w-100 rounded-3 fs-5 p-2">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
