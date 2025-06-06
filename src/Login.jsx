<<<<<<< HEAD
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
=======
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
>>>>>>> 23fe5bf0cadfe5e2563110761563bde88e3b9bc3
import logo from "./assets/envirocool-logo.png";
import "bootstrap/dist/css/bootstrap.min.css";

const Login = () => {
<<<<<<< HEAD
	const navigate = useNavigate(); // Initialize useNavigate
=======
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
>>>>>>> 23fe5bf0cadfe5e2563110761563bde88e3b9bc3

	//ROLE-BASED ACCESS API
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");

<<<<<<< HEAD
	const handleLogin = async (e) => {
		e.preventDefault();
		try {
			const response = await axios.post(
				"http://localhost/DeliveryTrackingSystem/login.php",
				{
					username,
					password,
				},
				{
					headers: {
						"Content-Type": "application/json",
					},
				}
			);

			const user = response.data.user;

			console.log("Login success", user);

			localStorage.setItem("user", JSON.stringify(user));

			// Redirect to dashboard
			if (user.role === "admin") {
				navigate("/admindash");
			} else if (user.role === "operationalmanager") {
				navigate("/opsdash");
			} else {
				navigate("/unknownrole");
			}
		} catch (error) {
			alert("Login failed: " + (error.response?.data?.error || "Server error"));
		}
	};
	//FRONTEND
	return (
		<div className="login-container container-fluid">
			<div className="login-card text-center container-fluid">
				<img
					src={logo}
					alt="Envirocool Logo"
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
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							className="form-control"
							required
						/>
					</div>

					<div className="mb-1">
						<label htmlFor="password" className="form-label">
							Password:
						</label>
						<input
							type="password"
							id="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="form-control"
							required
						/>
					</div>

					<div className="mb-5">
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
=======
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
>>>>>>> 23fe5bf0cadfe5e2563110761563bde88e3b9bc3
};

export default Login;
