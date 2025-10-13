import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import { renderToString } from "react-dom/server";

import { PiBuildingApartmentDuotone } from "react-icons/pi";
import { IoStorefrontSharp } from "react-icons/io5";
import { FaTruckFront, FaLocationDot } from "react-icons/fa6";

import "leaflet/dist/leaflet.css";

// ======== Icons ========
const customerIcon = new L.DivIcon({
  html: renderToString(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        color: "#dc2626",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "6px",
          padding: "2px 6px",
          fontWeight: "bold",
          fontSize: "12px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          marginBottom: "3px",
        }}
      >
        Customer Location
      </div>
      <FaLocationDot style={{ fontSize: "36px" }} />
    </div>
  ),
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const createTruckIcon = (deviceId, status) => {
  const truckLabel = deviceId
    ? deviceId.replace(/device[-_]?/i, "Truck ")
    : "Truck";

  const statusColors = {
    Moving: "#1e5a04ff",
    Stopped: "#dc2626ff",
    Traffic: "#f59e0b",
    Completed: "#53a967ff",
    Failed: "#eb5b6aff",
    Inactive: "#6b7280",
  };
  const color = statusColors[status] || "#1e5a04ff";

  return new L.DivIcon({
    html: renderToString(
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          color,
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "6px",
            padding: "2px 6px",
            fontWeight: "bold",
            fontSize: "12px",
            width: "60px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            marginBottom: "5px",
          }}
        >
          {truckLabel}
        </div>
        <FaTruckFront style={{ fontSize: "40px" }} />
      </div>
    ),
    className: "",
    iconSize: [30, 30],
    iconAnchor: [-5, 50],
  });
};

const buildingIcon = new L.DivIcon({
  html: renderToString(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        color: "#14559a",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "6px",
          padding: "2px 6px",
          fontWeight: "bold",
          fontSize: "12px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          marginBottom: "3px",
        }}
      >
        Envirocool Company
      </div>
      <PiBuildingApartmentDuotone style={{ fontSize: "40px" }} />
    </div>
  ),
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// ======== Helper Functions ========
const deg2rad = (deg) => deg * (Math.PI / 180);

const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// ======== MonitorDelivery Component ========
const MonitorDelivery = () => {
  const [etas, setEtas] = useState({});
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [activeTab, setActiveTab] = useState("inTransit");
  const [transactions, setTransactions] = useState({
    inTransit: [],
    completed: [],
    cancelled: [],
  });
  const [deviceRoutes, setDeviceRoutes] = useState({});
  const [currentPositions, setCurrentPositions] = useState({});
  const [trackingIntervals, setTrackingIntervals] = useState({});
  const [selectedCustomerPosition, setSelectedCustomerPosition] =
    useState(null);
  const [selectedCustomerInfo, setSelectedCustomerInfo] = useState(null);
  const [mapBounds, setMapBounds] = useState(null);

  const navigate = useNavigate();
  const companyLocation = [14.2091835, 121.1368418];

  // ======== Recenter Map Hook ========
  const RecenterMap = ({ location, zoom, bounds }) => {
    const map = useMap();
    useEffect(() => {
      if (bounds?.length > 0) {
        map.fitBounds(bounds, { padding: [80, 80] });
      } else if (location) {
        map.setView(location, zoom);
      }
    }, [location, zoom, bounds]);
    return null;
  };

  const handleAddDelivery = () => navigate("/add-delivery");

  const formatDateTime = (dateTime) => {
    if (!dateTime) return "N/A";
    const date = new Date(dateTime);
    if (isNaN(date.getTime())) return dateTime;
    const options = {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    };
    return date.toLocaleString("en-US", options);
  };

  

  // ======== Fetch Deliveries ========
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

        const uniqueById = (arr) =>
          Array.from(
            new Map(arr.map((item) => [item.transaction_id, item])).values()
          );

        const inTransit = uniqueById(
          outData
            .filter((d) =>
              ["In Transit", "Out for Delivery"].includes(d.status)
            )
            .map((d) => ({
              ...d,
              latitude: parseFloat(d.latitude) || null,
              longitude: parseFloat(d.longitude) || null,
            }))
        );

        const completed = uniqueById(
          completedData.map((d) => ({
            ...d,
            latitude: parseFloat(d.latitude) || null,
            longitude: parseFloat(d.longitude) || null,
          }))
        );

        const cancelled = uniqueById(
          cancelledData.map((d) => ({
            ...d,
            latitude: parseFloat(d.latitude) || null,
            longitude: parseFloat(d.longitude) || null,
          }))
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

  // ======== Fetch ETA ========
  const fetchETA = async (deviceId, distanceKm) => {
    try {
      const res = await axios.get(
        `http://localhost/DeliveryTrackingSystem/get_eta.php`,
        { params: { device_id: deviceId, distance_km: distanceKm } }
      );
      return res.data?.eta || "N/A";
    } catch (err) {
      console.error("Error fetching ETA for device:", deviceId, err);
      return "N/A";
    }
  };

  useEffect(() => {
    if (!selectedCustomerPosition) return;

    Object.keys(currentPositions).forEach(async (deviceId) => {
      const currentData = currentPositions[deviceId];
      if (!currentData?.position) return;

      // Skip ETA for Completed or Failed deliveries
      if (currentData.status === "Completed" || currentData.status === "Failed")
        return;

      const distanceKm = getDistanceFromLatLonInKm(
        currentData.position[0],
        currentData.position[1],
        selectedCustomerPosition[0],
        selectedCustomerPosition[1]
      );

      const eta = await fetchETA(deviceId, distanceKm);
      setEtas((prev) => ({ ...prev, [deviceId]: eta }));
    });
  }, [currentPositions, selectedCustomerPosition]);

  // ======== Device Tracking ========
  const startTrackingDevice = (deviceId) => {
    if (trackingIntervals[deviceId]) clearInterval(trackingIntervals[deviceId]);

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(
          `http://localhost/DeliveryTrackingSystem/get_current_location.php?device_id=${deviceId}`
        );

        const gpsData = res.data.data;
        if (!gpsData) return;

        const currPoint = {
          lat: parseFloat(gpsData.lat),
          lng: parseFloat(gpsData.lng),
          recorded_at: gpsData.recorded_at,
        };

        setCurrentPositions((prev) => {
          const prevData = prev[deviceId];

          // Do not update if delivery is Completed or Failed
          if (
            prevData?.status === "Completed" ||
            prevData?.status === "Failed"
          ) {
            return prev;
          }

          let status = "Moving";
          let stoppedMinutes = 0;

          if (prevData) {
            const distanceKm = getDistanceFromLatLonInKm(
              prevData.position[0],
              prevData.position[1],
              currPoint.lat,
              currPoint.lng
            );

            const diffMin =
              (new Date(currPoint.recorded_at) -
                new Date(prevData.lastRecordedAt)) /
              60000;

            if (diffMin >= 20) {
              status = "Inactive";
            } else if (distanceKm < 0.01) {
              status = diffMin >= 5 ? "Stopped" : "Traffic";
              stoppedMinutes = Math.round(diffMin);
            } else if (distanceKm < 0.05) {
              status = "Traffic";
            } else {
              status = "Moving";
            }
          }

          const newCurrentPositions = {
            ...prev,
            [deviceId]: {
              position: [currPoint.lat, currPoint.lng],
              status,
              stoppedMinutes,
              lastRecordedAt: currPoint.recorded_at,
            },
          };

          setDeviceRoutes((prevRoutes) => ({
            ...prevRoutes,
            [deviceId]: [
              ...(prevRoutes[deviceId] || []),
              [currPoint.lat, currPoint.lng],
            ],
          }));

          return newCurrentPositions;
        });
      } catch (err) {
        console.error("Error fetching device location for", deviceId, err);
      }
    }, 5000);

    setTrackingIntervals((prev) => ({ ...prev, [deviceId]: interval }));
  };

  // ======== Handle Transaction Click ========
  const handleTransactionClick = async (transaction) => {
    const isExpanded = expandedIndex === transaction.transaction_id;
    setExpandedIndex(isExpanded ? null : transaction.transaction_id);

    const customerPos =
      transaction.latitude && transaction.longitude
        ? [transaction.latitude, transaction.longitude]
        : null;

    setSelectedCustomerPosition(customerPos);
    setSelectedCustomerInfo(customerPos ? transaction : null);

    if (!transaction.assigned_device_id) {
      setDeviceRoutes({ [transaction.transaction_id]: [companyLocation] });
      setCurrentPositions({ [transaction.transaction_id]: null });
      setMapBounds([companyLocation, customerPos].filter(Boolean));
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost/DeliveryTrackingSystem/get_device_route.php?device_id=${transaction.assigned_device_id}`
      );

      const route = (res.data || []).map((p) => [
        parseFloat(p.lat),
        parseFloat(p.lng),
      ]);

      setDeviceRoutes((prev) => ({
        ...prev,
        [transaction.assigned_device_id]: route.length
          ? route
          : [companyLocation],
      }));

      const truckPos = route.length ? route[route.length - 1] : companyLocation;

      const finalStatus =
        activeTab === "completed"
          ? "Completed"
          : activeTab === "cancelled"
          ? "Failed"
          : "Moving";

      setCurrentPositions((prev) => ({
        ...prev,
        [transaction.assigned_device_id]: {
          position: truckPos,
          status: finalStatus,
          stoppedMinutes: 0,
          lastRecordedAt: route.length
            ? route[route.length - 1].recorded_at || new Date().toISOString()
            : new Date().toISOString(),
        },
      }));

      // Stop tracking if completed or cancelled
      if (activeTab === "inTransit") {
        startTrackingDevice(transaction.assigned_device_id);
      } else {
        if (trackingIntervals[transaction.assigned_device_id]) {
          clearInterval(trackingIntervals[transaction.assigned_device_id]);
          setTrackingIntervals((prev) => {
            const updated = { ...prev };
            delete updated[transaction.assigned_device_id];
            return updated;
          });
        }
      }

      const points = [companyLocation, truckPos];
      if (customerPos) points.push(customerPos);
      setMapBounds(points);
    } catch (err) {
      console.error(err);
      setDeviceRoutes({ [transaction.assigned_device_id]: [companyLocation] });
      setCurrentPositions({ [transaction.assigned_device_id]: null });
      setMapBounds([companyLocation, customerPos].filter(Boolean));
    }
  };

  // ======== Render Transactions ========
  const renderTransactions = (transactions, activeTab) => {
    const tabColors = {
      inTransit: { bg: "#EDF4FAFF", border: "#95B0CEFF" },
      completed: { bg: "#EAF8EACE", border: "#ABCFB4FF" },
      cancelled: { bg: "#FAEEEEE1", border: "#DDB4B8FF" },
    };

    if (!transactions?.length)
      return (
        <div className="text-center text-muted">No transactions to display</div>
      );

    return transactions.map((t) => (
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
          onClick={() => handleTransactionClick(t)}
        >
          <span>
            <strong className="text-success">Transaction No:</strong>{" "}
            {t.transaction_id}
          </span>
          <span>{expandedIndex === t.transaction_id ? "▲" : "▼"}</span>
        </div>

        {expandedIndex === t.transaction_id && (
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
              ["Tracking No.", t.tracking_number],
              [
                "Assigned Device:",
                t.assigned_device_id?.replace(/device[-_]?/i, "Truck ") ||
                  "Not assigned",
              ],
            ].map(([label, value], i) => (
              <div className="row mb-2" key={i}>
                <div className="col-5 fw-semibold text-success">{label}</div>
                <div className="col-7">{value || "N/A"}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    ));
  };

  // ======== Stop tracking for completed/cancelled tabs ========
  useEffect(() => {
    if (activeTab === "completed" || activeTab === "cancelled") {
      Object.keys(trackingIntervals).forEach((deviceId) =>
        clearInterval(trackingIntervals[deviceId])
      );
      setTrackingIntervals({});
    } else {
      const currentTabTransactions = transactions[activeTab] || [];
      currentTabTransactions.forEach((t) => {
        const deviceId = t.assigned_device_id;
        if (deviceId && !trackingIntervals[deviceId])
          startTrackingDevice(deviceId);
      });
    }
  }, [activeTab, transactions]);

  return (
    <AdminLayout
      title="Monitor Deliveries"
      onAddClick={handleAddDelivery}
      showSearch={false}
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
                style={{ height: window.innerWidth < 768 ? "400px" : "1000px" }}
              >
                <MapContainer
                  center={companyLocation}
                  zoom={10}
                  style={{ height: "100%", width: "100%" }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />
                  <RecenterMap
                    location={selectedCustomerPosition || companyLocation}
                    zoom={14}
                    bounds={mapBounds}
                  />
                  <Marker position={companyLocation} icon={buildingIcon}>
                    <Popup>
                      <div className="text-center">
                        <strong>Envirocool Company</strong>
                      </div>
                    </Popup>
                  </Marker>

                  {Object.keys(deviceRoutes).map((deviceId) => {
                    const route = deviceRoutes[deviceId];
                    if (!route?.length) return null;
                    const currentData = currentPositions[deviceId];
                    if (!currentData) return null;

                    return (
                      <React.Fragment key={deviceId}>
                        <Polyline
                          positions={route}
                          color="#9a0606ff"
                          weight={2}
                        />
                        <Marker
                          position={currentData.position}
                          icon={createTruckIcon(deviceId, currentData.status)}
                        >
                          <Popup>
                            <div>
                              <strong>
                                {deviceId.replace(/device[-_]?/i, "Truck ")}
                              </strong>
                              <br />
                              <strong>Status:</strong> {currentData.status}
                              {currentData.status === "Stopped" &&
                                ` (${currentData.stoppedMinutes} min)`}
                              {activeTab === "inTransit" &&
                                selectedCustomerPosition && (
                                  <>
                                    <br />
                                    <strong>Distance to Customer:</strong>{" "}
                                    {getDistanceFromLatLonInKm(
                                      currentData.position[0],
                                      currentData.position[1],
                                      selectedCustomerPosition[0],
                                      selectedCustomerPosition[1]
                                    ).toFixed(2)}{" "}
                                    km
                                    <br />
                                    <strong>ETA:</strong>{" "}
                                    {formatDateTime(etas[deviceId] )|| "Calculating..."}
                                    <br />
                                    <strong>Last Update:</strong>{" "}
                                    {formatDateTime(currentData.lastRecordedAt)}
                                  </>
                                )}
                            </div>
                          </Popup>
                        </Marker>
                      </React.Fragment>
                    );
                  })}

                  {selectedCustomerPosition && selectedCustomerInfo && (
                    <Marker
                      position={selectedCustomerPosition}
                      icon={customerIcon}
                    >
                      <Popup>
                        <div>
                          <strong>{selectedCustomerInfo.customer_name}</strong>
                          <br />
                          <span>{selectedCustomerInfo.customer_address}</span>
                          <br />
                          <strong>Tracking:</strong>{" "}
                          {selectedCustomerInfo.tracking_number}
                          <br />
                          <strong>Distance:</strong>{" "}
                          {getDistanceFromLatLonInKm(
                            companyLocation[0],
                            companyLocation[1],
                            selectedCustomerPosition[0],
                            selectedCustomerPosition[1]
                          ).toFixed(2)}{" "}
                          km
                        </div>
                      </Popup>
                    </Marker>
                  )}
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
