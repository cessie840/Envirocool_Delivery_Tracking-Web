import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import logo from "./assets/envirocool-logo.png";
import "bootstrap/dist/css/bootstrap.min.css";
import "./loading-overlay.css";

const Login = () => {
	const navigate = useNavigate(); // Initialize navigation function
	const [loading, setLoading] = useState(false); // Initializes loading screen function

	//ROLE-BASED ACCESS API
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");

	const handleLogin = async (e) => {
		e.preventDefault();
		setLoading(true);
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
				navigate("/AdminDashboard");
			} else if (user.role === "operationalmanager") {
				navigate("/OperationalManagerDashboard");
			} else {
				navigate("/");
			}
		} catch (error) {
			alert(
				"Login failed: " +
					(error.response?.data?.error || "Invalid username or password.")
			);
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
