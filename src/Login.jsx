import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import logo from "./assets/envirocool-logo.png";
import "bootstrap/dist/css/bootstrap.min.css";

const Login = () => {
	const navigate = useNavigate(); // Initialize useNavigate

	//ROLE-BASED ACCESS API
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");

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
};

export default Login;
