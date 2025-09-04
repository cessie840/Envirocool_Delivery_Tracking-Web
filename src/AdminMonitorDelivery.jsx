import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";

const MonitorDelivery = () => {
  const navigate = useNavigate();
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [activeTab, setActiveTab] = useState("inTransit");

  const [transactions, setTransactions] = useState({
    inTransit: [],
    completed: [],
    cancelled: [],
  });

  const [route, setRoute] = useState([
    [14.5995, 120.9842],
    [14.6042, 120.9825],
    [14.6164, 121.003],
  ]);
  const pickup = route[0];
  const dropoff = route[route.length - 1];

  const carIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/61/61205.png",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });

  const handleAddDelivery = () => navigate("/add-delivery");

  // fetch deliveries from PHP
useEffect(() => {
  const fetchDeliveries = async () => {
    try {
      const [outRes, completedRes, cancelledRes] = await Promise.all([
        axios.get(
          "http://localhost/DeliveryTrackingSystem/fetch_all_out_for_delivery.php"
        ),
        axios.get(
          "http://localhost/DeliveryTrackingSystem/fetch_all_completed_deliveries.php"
        ),
        axios.get(
          "http://localhost/DeliveryTrackingSystem/get_cancelled_deliveries.php"
        ), 
      ]);

      const outData = outRes.data.deliveries || outRes.data || [];
      const completedData =
        completedRes.data.deliveries || completedRes.data || [];
      const cancelledData =
        cancelledRes.data.deliveries || cancelledRes.data || [];

      const uniqueById = (arr) => {
        const map = new Map();
        arr.forEach((item) => {
          map.set(item.transaction_id, item);
        });
        return Array.from(map.values());
      };

      
      const inTransit = uniqueById(
        outData.filter(
          (d) => d.status === "In Transit" || d.status === "Out for Delivery"
        )
      );

      const completed = uniqueById(
        completedData.filter((d) => d.status === "Delivered")
      );

      const cancelled = uniqueById(
        cancelledData.filter((d) => d.status === "Cancelled")
      );

     
      const sortByTimeDesc = (a, b) =>
        new Date(b.completed_time || b.cancelled_at || b.time) -
        new Date(a.completed_time || a.cancelled_at || a.time);

      setTransactions({
        inTransit: inTransit.sort(sortByTimeDesc),
        completed: completed.sort(sortByTimeDesc),
        cancelled: cancelled.sort(sortByTimeDesc),
      });
    } catch (error) {
      console.error("Error fetching deliveries:", error);
    }
  };

  fetchDeliveries();
}, []);




  const renderTransactions = (transactions) => (
    <div
      style={{
        maxHeight: "80vh",
        overflowY: "auto",
        paddingRight: "5px",
      }}
    >
      {transactions.map((t, index) => (
        <div
          key={t.transaction_id}
          className="bg-white rounded shadow-sm p-3 mb-3"
        >
          <div
            className="d-flex justify-content-between align-items-center mb-2"
            style={{ cursor: "pointer", fontSize: "1.2rem" }}
            onClick={() =>
              setExpandedIndex(index === expandedIndex ? null : index)
            }
          >
            <span>
              <strong className="text-success">Transaction No:</strong>{" "}
              {t.transaction_id}
            </span>
            <span>{expandedIndex === index ? "▲" : "▼"}</span>
          </div>

          {expandedIndex === index && (
            <div className="border rounded p-3" style={{ fontSize: "1rem" }}>
              {[
                ["Customer Name:", t.customer_name],
                ["Contact No.:", t.contact],
                ["Shipping Address:", t.customer_address],
                ["Order Description:", t.description],
                ["Date of Order:", t.time],
                ...(activeTab === "completed"
                  ? [
                      ["Shipout Date:", t.shipout_time],
                      ["Received Date:", t.completed_time],
                    ]
                  : activeTab === "cancelled"
                  ? [
                      ["Ship Out Date:", t.shipout_time],
                      ["Cancelled Date:", t.cancelled_time],
                      ["Cancellation Reason:", t.cancelled_reason], 
                    ]
                  : [["Ship Out Date:", t.shipout_time]]),
                ["Delivery Incharge:", t.driver],
                ["Shipping Process:", t.status],
                ["Distance:", t.distance],
                ["ETA:", t.eta],
              ].map(([label, value], i) => (
                <div className="row mb-2" key={i}>
                  <div className="col-5 fw-semibold text-success">{label}</div>
                  <div className="col-7">{value || "N/A"}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <AdminLayout title="Monitor Delivery" onAddClick={handleAddDelivery}>
      <div
        style={{
          marginTop: "30px",
          backgroundColor: "#fdfafaff",
          minHeight: "100vh",
          padding: "20px",
        }}
      >
        <div className="container-fluid">
          <div className="row g-3">
            <div style={{ fontSize: 30, fontWeight: "bold" }}>
              Transactions:
            </div>

            {/* LEFT PANEL */}
            <div className="col-12 col-md-5">
              {/* Tabs */}
              <div className="rounded p-2 d-flex flex-wrap gap-2 mb-3">
                {[
                  ["inTransit", "In Transit"],
                  ["completed", "Completed"],
                  ["cancelled", "Cancelled"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    className={`btn btn-lg flex-fill ${
                      activeTab === key
                        ? "btn-success"
                        : "btn-outline-secondary"
                    }`}
                    style={{ fontSize: "1.2rem", boxShadow: "5px 4px 5px rgba(156, 153, 153, 0.6)" }}
                    onClick={() => setActiveTab(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Scrollable Transaction List */}
              {renderTransactions(transactions[activeTab])}
            </div>

            {/* RIGHT: MAP */}
            <div className="col-12 col-md-7">
              <div
                className="bg-white shadow-sm rounded overflow-hidden"
                style={{
                  height: window.innerWidth < 768 ? "400px" : "1000px",
                }}
              >
                <MapContainer
                  center={pickup}
                  zoom={14}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  <Polyline positions={route} color="blue" weight={4} />
                  <Marker position={pickup}>
                    <Popup>Pickup</Popup>
                  </Marker>
                  <Marker position={dropoff}>
                    <Popup>Dropoff</Popup>
                  </Marker>
                  <Marker position={route[1]} icon={carIcon}>
                    <Popup>In Transit</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default MonitorDelivery;
