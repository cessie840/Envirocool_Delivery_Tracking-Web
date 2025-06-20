import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import logo from "./assets/envirocool-logo.png";
import "bootstrap/dist/css/bootstrap.min.css";
import "./loading-overlay.css";

const Login = () => {
  const navigate = useNavigate(); // Initialize navigation function
  const [loading, setLoading] = useState(false); // Initializes loading screen function
  //ROLE-BASED ACCESS API
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
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await axios.post(
        "http://localhost/DeliveryTrackingSystem/Login.php",
        {
          username,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      const user = response.data.user;
      console.log("Login success", user);
      localStorage.setItem("user", JSON.stringify(user));

      alert("Login successful!");

      // Redirect to dashboard
      switch (user.role) {
        case "admin":
          navigate("/admin-dashboard");
          break;
        case "operationalmanager":
          navigate("/operational-delivery-details");
          break;
        case "deliverypersonnel":
          navigate("/driver-dashboard");
          break;
        default:
          navigate("/");
          break;
      }
    } catch (error) {
      const errMsg = error?.response?.data?.error;

      switch (errMsg) {
        case "Missing username or password":
          setErrorMessage("Please enter both username and password.");
          break;
        case "Invalid password":
          setErrorMessage("Incorrect password. Try again.");
          break;
        case "Invalid username":
          setErrorMessage("Username not found.");
          break;
        case "db_error":
          setErrorMessage("A database error occurred. Try again.");
          break;
        case "server_error":
          setErrorMessage("Server error. Please contact support.");
          break;
        default:
          setErrorMessage("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
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

          {loading ? (
            <div className="loading-overlay">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <button
              type="submit"
              className="btn login-btn w-100 rounded-3 fs-5 p-2"
            >
              Login
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
