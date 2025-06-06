import React from "react";
import { useEffect } from "react";
import logo from "./assets/envirocool-logo.png";
import {
	FaClipboardList,
	FaTruck,
	FaChartBar,
	FaCog,
	FaSignOutAlt,
	FaSearch,
	FaHome,
} from "react-icons/fa";

const Dashboard = () => {
	useEffect(() => {
		document.title = "Admin Dashboard"; //OVERRIDES PAGE TITLE
	}, []);
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
						<FaTruck className="icon" /> MONITOR DELIVERY
					</button>
					<button className="nav-btn">
						<FaChartBar className="icon" /> GENERATE REPORT
					</button>
					<button className="nav-btn">
						<FaCog className="icon" /> SETTINGS
					</button>
					<button className="nav-btn logout">
						<FaSignOutAlt className="icon" /> LOGOUT
					</button>
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
					<p>Analytics Here</p>
				</div>
			</main>
		</div>
	);
};

export default AdminDashboard;
