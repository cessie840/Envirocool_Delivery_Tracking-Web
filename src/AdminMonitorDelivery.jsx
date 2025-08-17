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

const route = [
  [14.5995, 120.9842],
  [14.6042, 120.9825],
  [14.6164, 121.003],
];

const MonitorDelivery = () => {
  const navigate = useNavigate();
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [activeTab, setActiveTab] = useState("inTransit");
  const [transactions, setTransactions] = useState({
    inTransit: [],
    completed: [],
    cancelled: [],
  });
  const [loading, setLoading] = useState(true);

  const pickup = route[0];
  const dropoff = route[route.length - 1];

  const carIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/61/61205.png",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });

  const handleAddDelivery = () => navigate("/add-delivery");

  // ✅ Fetch from your PHP endpoint
useEffect(() => {
  const fetchDeliveries = async () => {
    try {
      const response = await fetch(
        "http://localhost/DeliveryTrackingSystem/fetch_out_for_delivery.php"
      );

      const data = await response.json();

      if (Array.isArray(data)) {
        const mapped = data.map((d) => ({
          id: d.transactionNo,
          name: d.customerName,
          contact: d.contact,
          address: d.address,
          description: d.items.map((i) => `${i.qty} × ${i.name}`).join(", "),
          time: "N/A",
          driver: d.driverName
            ? `${d.driverName} (${d.driverUsername})`
            : d.driverUsername || "Unassigned",
          // ✅ now shows assigned driver
          status: "Out for Delivery",
          distance: "—",
          eta: "—",
        }));

        setTransactions((prev) => ({
          ...prev,
          inTransit: mapped,
        }));
      }
    } catch (err) {
      console.error("Error fetching deliveries:", err);
    } finally {
      setLoading(false);
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
      {transactions.map((tx, index) => (
        <div key={tx.id} className="bg-white rounded shadow-sm p-3 mb-3">
          <div
            className="d-flex justify-content-between align-items-center mb-2"
            style={{ cursor: "pointer", fontSize: "1.2rem" }}
            onClick={() =>
              setExpandedIndex(index === expandedIndex ? null : index)
            }
          >
            <span>
              <strong className="text-success">Transaction No:</strong> {tx.id}
            </span>
            <span>{expandedIndex === index ? "▲" : "▼"}</span>
          </div>

          {expandedIndex === index && (
            <div className="border rounded p-3" style={{ fontSize: "1rem" }}>
              {[
                ["Customer Name:", tx.name],
                ["Contact No.:", tx.contact],
                ["Shipping Address:", tx.address],
                ["Order Description:", tx.description],
                ["Shipment Time:", tx.time],
                ["Delivery Incharge:", tx.driver],
                ["Shipping Process:", tx.status],
                ["Distance:", tx.distance],
                ["ETA:", tx.eta],
              ].map(([label, value], i) => (
                <div className="row mb-2" key={i}>
                  <div className="col-5 fw-semibold text-success">{label}</div>
                  <div className="col-7">{value}</div>
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
          backgroundColor: "#f5f5f5",
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
              <div className="bg-white rounded shadow-sm p-2 d-flex flex-wrap gap-2 mb-3">
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
                    style={{ fontSize: "1.2rem" }}
                    onClick={() => setActiveTab(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Scrollable Transaction List */}
              {loading ? (
                <div>Loading...</div>
              ) : (
                renderTransactions(transactions[activeTab])
              )}
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
