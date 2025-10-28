import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import logo from "./assets/envirocool-logo.png";
import "bootstrap/dist/css/bootstrap.min.css";
import "./loading-overlay.css";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showTerms, setShowTerms] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

 const handleLogin = async (e) => {
  e.preventDefault();
  setErrorMessage("");

  if (!agreed) {
    setErrorMessage("You must agree to the Terms and Conditions before logging in.");
    return;
  }

  setLoading(true);

  try {
    const response = await axios.post(
      "http://localhost/DeliveryTrackingSystem/login.php",
      { username, password },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
        validateStatus: () => true, 
      }
    );

    const data = response.data;

    // ✅ If backend indicates failure
    if (!data.success) {
      setErrorMessage(data.message || "Login failed. Please try again.");
      return; // 🚫 Stop here, don’t proceed to login success
    }

    // ✅ If success
    const user = data.user;
    localStorage.setItem("user", JSON.stringify(user));
    sessionStorage.setItem("showLoginNotif", "true");


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
  } catch (networkError) {
    // ✅ This runs ONLY if the server is unreachable (no connection)
    console.warn("Network error occurred:", networkError.message);
    setErrorMessage("Unable to reach the server. Please check your connection.");
  } finally {
    setLoading(false);
  }
};


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
          {/* Username */}
          <div className="mb-3">
            <label htmlFor="username" className="login form-label">
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

          {/* Password */}
          <div className="mb-1 position-relative">
            <label htmlFor="password" className="login form-label">
              Password:
            </label>
            <div className="position-relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-control pe-5"
                required
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "15px",
                  top: "49%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  color: "#1E1F1FFF",
                }}
              >
                {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
              </span>
            </div>
          </div>

          {/* Terms + Forgot Password */}
          <div className="d-flex justify-content-between align-items-center mt-3 mb-4 fs-6">
            <div className="d-flex align-items-center justify-content-center">
              <input
                type="checkbox"
                className="form-check-input me-2"
                id="agree"
                checked={agreed}
                onChange={() => setAgreed(!agreed)}
              />
              <label
                htmlFor="agree"
                className="tnc form-check-label mb-0 fw-semibold"
              >
                I agree to the{" "}
                <span
                  className="tnc text-primary fw-semibold"
                  style={{ cursor: "pointer" }}
                  onClick={() => setShowTerms(true)}
                >
                  Terms and Conditions
                </span>
              </label>
            </div>

            <span
              className="small fw-semibold text-primary"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/forgotpassword")}
            >
              Forgot password?
            </span>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="text-danger mb-3 text-center fw-bold">
              {errorMessage}
            </div>
          )}

          {/* Loading / Button */}
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

      {/* Terms Modal */}
      {showTerms && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content terms-modal">
              <div className="modal-header bg-light">
                <h5 className="modal-title">Terms and Conditions</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowTerms(false)}
                ></button>
              </div>
              <div
                className="modal-body bg-white terms-body"
                style={{ maxHeight: "70vh", overflowY: "auto" }}
              >
                <p>
                  Welcome to the Envirocool Delivery & Monitoring System
                  (“System”). These Terms and Conditions (“Terms”) govern the
                  use of the System by Admins, Operational Managers, and
                  Delivery Personnel. By accessing or using the System, you
                  agree to comply with these Terms.
                </p>

                <h6 className="fw-bold mt-3">1. Purpose of the System</h6>
                <p>
                  The Envirocool System is designed to support Envirocool
                  Company’s operations in selling, delivering, and monitoring
                  air conditioning units and related services. The System is
                  strictly for official business use only.
                </p>

                <h6 className="fw-bold mt-3">
                  2. User Roles and Responsibilities
                </h6>
                <p className="mb-1 fw-semibold">2.1 Admin</p>
                <ul>
                  <li>Add and manage delivery transactions.</li>
                  <li>Reschedule cancelled deliveries.</li>
                  <li>View and update transaction details.</li>
                  <li>Monitor deliveries through GPS.</li>
                  <li>Generate and export reports.</li>
                  <li>Manage account settings.</li>
                  <li>Manage these Terms & Conditions.</li>
                </ul>

                <p className="mb-1 fw-semibold">2.2 Operational Manager</p>
                <ul>
                  <li>Create and manage delivery personnel accounts.</li>
                  <li>View delivery transactions.</li>
                  <li>Assign or reassign delivery personnel.</li>
                  <li>Monitor assigned and unassigned orders.</li>
                  <li>Manage account settings.</li>
                </ul>

                <p className="mb-1 fw-semibold">2.3 Delivery Personnel</p>
                <ul>
                  <li>View assigned deliveries.</li>
                  <li>
                    Update delivery status (Out for Delivery, Delivered,
                    Cancelled).
                  </li>
                </ul>

                <h6 className="fw-bold mt-3">3. Data Privacy and Protection</h6>
                <p>
                  Envirocool respects and protects personal data in compliance
                  with the{" "}
                  <b>Data Privacy Act of 2012 (Republic Act No. 10173).</b>
                </p>
                <ul>
                  <li>
                    Only authorized users may access customer and transaction
                    data.
                  </li>
                  <li>
                    Personal information is used solely for transactions and
                    services.
                  </li>
                  <li>Users may not share, disclose, or misuse data.</li>
                  <li>
                    Breaches of customer information may lead to disciplinary or
                    legal action.
                  </li>
                </ul>

                <h6 className="fw-bold mt-3">4. Security of Accounts</h6>
                <ul>
                  <li>Users must keep account credentials confidential.</li>
                  <li>Sharing of usernames and passwords is prohibited.</li>
                  <li>Report suspected unauthorized access immediately.</li>
                </ul>

                <h6 className="fw-bold mt-3">5. Acceptable Use</h6>
                <ul>
                  <li>Use the System only for official purposes.</li>
                  <li>Enter accurate and truthful data.</li>
                  <li>Do not hack, exploit, or misuse the System.</li>
                  <li>Do not use the System for personal gain.</li>
                </ul>

                <h6 className="fw-bold mt-3">6. Reports and Monitoring</h6>
                <ul>
                  <li>Reports are for internal use only.</li>
                  <li>
                    Data visualizations must not be altered or misrepresented.
                  </li>
                  <li>Only management may use reports for decision-making.</li>
                </ul>

                <h6 className="fw-bold mt-3">7. Limitation of Liability</h6>
                <ul>
                  <li>
                    Not liable for user errors in data or delivery handling.
                  </li>
                  <li>Not liable for delays due to incorrect data.</li>
                  <li>
                    Not liable for unauthorized use due to user negligence.
                  </li>
                </ul>

                <h6 className="fw-bold mt-3">8. Amendments to Terms</h6>
                <p>
                  Envirocool Company may update these Terms anytime. Updates
                  will be posted in the System. Continued use means acceptance
                  of the revised Terms.
                </p>

                <h6 className="fw-bold mt-3">9. Acknowledgment</h6>
                <p>
                  By using the Envirocool Delivery & Monitoring System, you
                  acknowledge that you have read, understood, and agreed to
                  these Terms and Conditions.
                </p>
              </div>
              <div className="modal-footer bg-light">
                <button
                  className="btn close-btn py-1 fs-6"
                  onClick={() => setShowTerms(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
