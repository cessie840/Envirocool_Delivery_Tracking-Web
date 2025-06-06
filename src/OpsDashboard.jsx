import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "./assets/envirocool-logo.png";
import "./loading-overlay.css";
import {
	FaClipboardList,
	FaCog,
	FaSignOutAlt,
	FaSearch,
	FaHome,
} from "react-icons/fa";

const OpsDashboard = () => {
	const navigate = useNavigate(); // Initialize useNavigate
	const [loading, setLoading] = useState(false); //Initialize loading screen function

	//OVERRIDES TITLE
	useEffect(() => {
		document.title = "Operational Manager Dashboard";
	}, []);

	//LOGOUT
	const handleLogout = () => {
		setLoading(true);

		setTimeout(() => {
			setLoading(false);
			localStorage.removeItem("user");
			navigate("/");
		}, 1200);
	};
	return (
		<div className="dashboard-container d-flex vh-100">
			{/* SIDEBAR  */}
			<aside className="sidebar d-flex flex-column align-items-center p-3">
				{/* LOGO  */}
				<img
					src={logo}
					alt="Envirocool Logo"
					className="logo mb-4"
					width="250px"
				/>
				{/* NAVIGATIONS  */}
				<nav className="nav-buttons">
					<button className="nav-btn">
						<FaHome className="icon" /> DASHBOARD
					</button>
					<button className="nav-btn">
						<FaClipboardList className="icon" /> DELIVERY DETAILS
					</button>
					<button className="nav-btn">
						<FaCog className="icon" /> SETTINGS
					</button>
					<button className="nav-btn logout" onClick={handleLogout}>
						<FaSignOutAlt className="icon" /> LOGOUT
					</button>
					{/*LOADING SCREEN AFTER LOGOUT*/}
					{loading && (
						<div className="loading-overlay">
							<div className="spinner-border text-primary" role="status">
								<span className="visually-hidden">Loading...</span>
							</div>
						</div>
					)}
				</nav>
			</aside>

			{/* MAIN CONTENT  */}
			<main className="main-panel flex-grow-1 p-4">
				<div className="dashboard-header d-flex justify-content-between align-items-center">
					<h2 className="fs-2">Dashboard</h2>
					{/* SEARCH BAR  */}
					<div className="search-bar position-relative me-3">
						<input type="text" placeholder="Search..." />
						<FaSearch className="search-icon" />
					</div>
				</div>
				{/* ADD DELIVERY BUTTON  */}
				<div className="text-end mx-4 my-5">
					<button className="add-delivery rounded-2 px-5 py-2 fs-5">
						Add Delivery
					</button>
				</div>
				{/* DASHBOARD CONTENT  */}
				<div className="dashboard-content text-center mt-5 fs-4 border p-5">
					<p>Assign Deliveries Here</p>
				</div>
			</main>
		</div>
	);
};

export default OpsDashboard;
