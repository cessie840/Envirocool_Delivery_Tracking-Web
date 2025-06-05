import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "./assets/envirocool-logo.png";
import "bootstrap/dist/css/bootstrap.min.css";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setErrorMessage("Please enter both username and password.");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost/deliverytrackingcapstone/backend/login.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await response.json();

      switch (data.status) {
        case "success":
          setErrorMessage("");
          alert("Login successful!");
          navigate("/dashboard");
          break;
        case "incorrect_password":
          setErrorMessage("Incorrect password. Please check and try again.");
          break;
        case "user_not_found":
          setErrorMessage("Username not found. Please check and try again.");
          break;
        default:
          alert("Unexpected error occurred.");
          break;
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Failed to connect to the server.");
    }
  };

  return (
    <div className="login-container container-fluid">
      <div className="login-card text-center container-fluid">
        <img
          src={logo}
          alt="EnviroCool Logo"
          className="login-logo img-fluid mb-4"
          width="300"
        />

        <form className="login-form text-start" onSubmit={handleLogin}>
          <div className="mb-3">
            <label htmlFor="username" className="form-label">
              Username:
            </label>
            <input
              type="text"
              id="username"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="mb-1">
            <label htmlFor="password" className="form-label">
              Password:
            </label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <a
              href="#"
              className="small fw-semibold"
              onClick={(e) => {
                e.preventDefault();
                navigate("/forgotpassword");
              }}
            >
              Forgot password?
            </a>
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
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
