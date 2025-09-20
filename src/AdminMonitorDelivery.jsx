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

  
  const formatDateTime = (dateTime) => {
    if (!dateTime) return "N/A";
    const date = new Date(dateTime);
    if (isNaN(date.getTime())) return dateTime;

    const formattedDate = date.toLocaleDateString("en-US");
    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return `${formattedDate} |  ${formattedTime}`;
  };

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
          arr.forEach((item) => map.set(item.transaction_id, item));
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
          new Date(b.completed_time || b.cancelled_time || b.time) -
          new Date(a.completed_time || a.cancelled_time || a.time);

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

  const renderTransactions = (transactions, activeTab) => {
    const tabColors = {
      inTransit: { bg: "#EDF4FAFF", border: "#95B0CEFF" },
      completed: { bg: "#EAF8EACE", border: "#ABCFB4FF" },
      cancelled: { bg: "#FAEEEEE1", border: "#DDB4B8FF" },
    };

    return (
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
            className="rounded shadow-sm p-3 mb-3"
            style={{
              backgroundColor: tabColors[activeTab].bg,
              border: `1px solid ${tabColors[activeTab].border}`,
            }}
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
              <div
                className="border rounded p-3 bg-white"
                style={{
                  fontSize: "1rem",
                  border: `2px solid ${tabColors[activeTab].border}`,
                }}
              >
                {[
                  ["Client Name:", t.customer_name],
                  ["Contact No.:", t.contact],
                  ["Shipping Address:", t.customer_address],
                  ["Item Name:", t.description],
                  ["Date of Order:", formatDateTime(t.time)],
                  ...(activeTab === "completed"
                    ? [
                        ["Shipout Date:", formatDateTime(t.shipout_time)],
                        ["Received Date:", formatDateTime(t.completed_time)],
                      ]
                    : activeTab === "cancelled"
                    ? [
                        ["Shipout Date:", formatDateTime(t.shipout_time)],
                        ["Cancelled Date:", formatDateTime(t.cancelled_time)],
                        ["Cancellation Reason:", t.cancelled_reason],
                      ]
                    : [["Shipout Date:", formatDateTime(t.shipout_time)]]),
                  ["Delivery Incharge:", t.driver],
                  ["Delivery Status:", t.status],
                  ["Tracking No. ", t.tracking_number],
                  ["Distance:", t.distance],
                  ["ETA:", formatDateTime(t.eta)],
                ].map(([label, value], i) => (
                  <div className="row mb-2" key={i}>
                    <div className="col-5 fw-semibold text-success">
                      {label}
                    </div>
                    <div className="col-7">{value || "N/A"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <AdminLayout
      title="Monitor Deliveries"
      onAddClick={handleAddDelivery}
    >
      <div className="p-4 bg-white rounded-4 border border-secondary-subtle">
        <div className="container-fluid p-3">
          <div className="row g-3">
            <div className="col-12 col-md-5">
              <div className="rounded p-2 d-flex flex-wrap gap-2 mb-3">
                {[
                  ["inTransit", "In Transit", "#1762b1ff"],
                  ["completed", "Completed", "#53a967ff"],
                  ["cancelled", "Cancelled", "#eb5b6aff"],
                ].map(([key, label, color]) => (
                  <button
                    key={key}
                    className="btn btn-lg flex-fill fw-semibold"
                    style={{
                      backgroundColor: activeTab === key ? color : "#ffffffff",
                      color: activeTab === key ? "white" : color,
                      border: `1px solid ${color}`,
                      fontSize: "1.2rem",
                      boxShadow:
                        activeTab === key ? "none" :  "0 0.5rem 0.6rem rgba(0, 0, 0, 0.14)",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== key) {
                        e.target.style.backgroundColor = color;
                        e.target.style.color = "white";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== key) {
                        e.target.style.backgroundColor = "#ffffffff";
                        e.target.style.color = color;
                      }
                    }}
                    onClick={() => setActiveTab(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {renderTransactions(transactions[activeTab], activeTab)}
            </div>

            <div className="col-12 col-md-7">
              <div
                className="bg-white shadow-sm rounded overflow-hidden border border-info"
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
