import React, { useState, useRef, useEffect } from "react";
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
  const [zoomOnNextClick, setZoomOnNextClick] = useState(false);

 const [etas, setEtas] = useState({});
 const [lastEtaUpdate, setLastEtaUpdate] = useState({});

  const [expandedIndex, setExpandedIndex] = useState(null);
  const [activeTab, setActiveTab] = useState("inTransit");
  const [transactions, setTransactions] = useState({

    inTransit: [],
    completed: [],
    cancelled: [],
  });

  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [deviceRoutes, setDeviceRoutes] = useState({});
  const [currentPositions, setCurrentPositions] = useState({});
  const [trackingIntervals, setTrackingIntervals] = useState({});
  const [selectedCustomerPosition, setSelectedCustomerPosition] =
    useState(null);
  const [selectedCustomerInfo, setSelectedCustomerInfo] = useState(null);


  const navigate = useNavigate();
  const companyLocation = [14.2091835, 121.1368418];

  

const truckMarkerRefs = useRef({});


  const handleAddDelivery = () => navigate("/add-delivery");
const [hasZoomed, setHasZoomed] = useState(false);

  const MapViewUpdater = ({ position, zoom, triggerZoom, onZoomDone }) => {
    const map = useMap();

    useEffect(() => {
      if (!position || !triggerZoom) return;

    
      map.flyTo(position, zoom || map.getZoom(), {
        animate: true,
        duration: 1.2,
      });

      if (onZoomDone) onZoomDone(); 
    }, [position, zoom, triggerZoom, map, onZoomDone]);

    return null;
  };




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

        // const outData = outRes.data.deliveries || outRes.data || [];
        // const completedData =
        //   completedRes.data.deliveries || completedRes.data || [];
        // const cancelledData =
        //   cancelledRes.data.deliveries || cancelledRes.data || [];

        const toArray = (data) => {
          if (Array.isArray(data)) return data;
          if (data && Array.isArray(data.deliveries)) return data.deliveries;
          return [];
        };

        const outData = toArray(outRes.data);
        const completedData = toArray(completedRes.data);
        const cancelledData = toArray(cancelledRes.data);


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



 useEffect(() => {
   if (!selectedCustomerPosition) return;

   Object.keys(currentPositions).forEach(async (deviceId) => {
     const currentData = currentPositions[deviceId];
     if (!currentData?.position) return;
     if (["Completed", "Failed"].includes(currentData.status)) return;

     const distanceKm = getDistanceFromLatLonInKm(
       currentData.position[0],
       currentData.position[1],
       selectedCustomerPosition[0],
       selectedCustomerPosition[1]
     );

     const now = Date.now();
     const lastUpdate = lastEtaUpdate[deviceId] || 0;
     const prevEta = etas[deviceId];
     const prevDistance = currentData.prevDistance || null;

    
     if (now - lastUpdate < 30000 && Math.abs(distanceKm - prevDistance) < 0.2)
       return;

     try {
       const res = await axios.get(
         `http://localhost/DeliveryTrackingSystem/get_eta.php`,
         { params: { device_id: deviceId, distance_km: distanceKm } }
       );

       const eta = res.data?.eta || prevEta || "N/A";
       setEtas((prev) => ({ ...prev, [deviceId]: eta }));
       setLastEtaUpdate((prev) => ({ ...prev, [deviceId]: now }));

       
       setCurrentPositions((prev) => ({
         ...prev,
         [deviceId]: { ...prev[deviceId], prevDistance: distanceKm },
       }));
     } catch (err) {
       console.error("ETA fetch failed for", deviceId, err);
     }
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

         if (
           prevData?.status === "Completed" ||
           prevData?.status === "Failed"
         ) {
           return prev;
         }

         let status = "Moving";
       

         if (prevData) {
           const distanceKm = getDistanceFromLatLonInKm(
             prevData.position[0],
             prevData.position[1],
             currPoint.lat,
             currPoint.lng
           );

           const lastRecorded = new Date(prevData.lastRecordedAt);
           const now = new Date();
           const diffMin = (now - lastRecorded) / 60000;

        
           if (diffMin >= 20) {
             status = "Inactive"; 
           } else if (distanceKm < 0.005) {
        
             if (diffMin >= 5) status = "Stopped"; 
             else status = "Traffic"; 
           } else if (distanceKm >= 0.005 && distanceKm < 0.05) {
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
   }, 100);

   setTrackingIntervals((prev) => ({ ...prev, [deviceId]: interval }));
 };


const handleTransactionClick = async (transaction) => {
  const isExpanded = expandedIndex === transaction.transaction_id;
  const deviceId = transaction.assigned_device_id;

  if (isExpanded) {
  
    setExpandedIndex(null);
    setSelectedDeviceId(null);
    setSelectedCustomerPosition(null);


    if (deviceId) {
      setCurrentPositions((prev) => {
        const updated = { ...prev };
        delete updated[deviceId];
        return updated;
      });
      setDeviceRoutes((prev) => {
        const updated = { ...prev };
        delete updated[deviceId];
        return updated;
      });

   
      if (trackingIntervals[deviceId]) {
        clearInterval(trackingIntervals[deviceId]);
        setTrackingIntervals((prev) => {
          const updated = { ...prev };
          delete updated[deviceId];
          return updated;
        });
      }
    }
  if (!expandedIndex) {
    setCurrentPositions({});
    setDeviceRoutes({});
  }

  setZoomOnNextClick(true);
  return;

  
}
   

  setExpandedIndex(transaction.transaction_id);

  const customerPos =
    transaction.latitude && transaction.longitude
      ? [transaction.latitude, transaction.longitude]
      : null;
  setSelectedCustomerPosition(customerPos);
 setSelectedCustomerInfo(transaction);



  if (!deviceId) {
    setDeviceRoutes({ [transaction.transaction_id]: [companyLocation] });
    setCurrentPositions({ [transaction.transaction_id]: [companyLocation] });
    setSelectedDeviceId(transaction.transaction_id);
    setZoomOnNextClick(true);
    return;
  }

  try {
    const res = await axios.get(
      `http://localhost/DeliveryTrackingSystem/get_device_route.php?device_id=${deviceId}`
    );

    const route = (res.data || []).map((p) => [
      parseFloat(p.lat),
      parseFloat(p.lng),
    ]);

    const initialTruckPos = route.length
      ? route[route.length - 1]
      : companyLocation;

    setCurrentPositions((prev) => ({
      ...prev,
      [deviceId]: {
        position: initialTruckPos,
        status: "Moving",
   
        lastRecordedAt: new Date().toISOString(),
      },
    }));

    setDeviceRoutes((prev) => ({
      ...prev,
      [deviceId]: route.length ? route : [companyLocation],
    }));

    setSelectedDeviceId(deviceId);
    setZoomOnNextClick(true);

   
    if (activeTab === "inTransit") startTrackingDevice(deviceId);
    if (deviceId) {
      setTimeout(() => {
        if (truckMarkerRefs.current[deviceId]) {
          truckMarkerRefs.current[deviceId].openPopup();

          setTimeout(() => {
            truckMarkerRefs.current[deviceId]?.closePopup();
          }, 6000);
        }
      }, 1500); // 200ms wait for Marker to mount
    }

  } catch (err) {
    console.error(err);
   
    setCurrentPositions({ [deviceId]: [companyLocation] });
    setDeviceRoutes({ [deviceId]: [companyLocation] });
    setSelectedDeviceId(deviceId);
    setZoomOnNextClick(true);
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
              [
                "Item Name:",
                `${t.type_of_product || ""} ${t.description || ""}`.trim(),
              ],
              ["Date of Order:", (t.time)],
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
      setCurrentPositions({}); 
      setDeviceRoutes({}); 
      setSelectedDeviceId(null);
      setSelectedCustomerPosition(null);
    }
  }, [activeTab]);

  useEffect(() => {
 
    setExpandedIndex(null);
    setSelectedDeviceId(null);
    setSelectedCustomerPosition(null);
    setSelectedCustomerInfo(null);
    setCurrentPositions({});
    setDeviceRoutes({});

    setZoomOnNextClick(true);
  }, [activeTab]);
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
                  zoom={20}
                  style={{ height: "100%", width: "100%" }}
                  scrollWheelZoom={true}
                  doubleClickZoom={true}
                  zoomControl={true}
                  dragging={true}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />
                  <MapViewUpdater
                    position={
                      selectedDeviceId && currentPositions[selectedDeviceId]
                        ? currentPositions[selectedDeviceId].position
                        : companyLocation // default
                    }
                    zoom={17}
                    triggerZoom={zoomOnNextClick}
                    onZoomDone={() => setZoomOnNextClick(false)}
                  />

                  <Marker position={companyLocation} icon={buildingIcon}>
                    <Popup>
                      <strong>Envirocool Company</strong>
                    </Popup>
                  </Marker>
{/* Truck & Customer Markers */}
{Object.keys(deviceRoutes).map((deviceId) => {
  const currentData = currentPositions[deviceId];
  const route = deviceRoutes[deviceId];

 
  if (!currentData?.position || !route?.length) return null;


  if (selectedDeviceId && deviceId !== selectedDeviceId) return null;

  return (
    <React.Fragment key={deviceId}>
      <Polyline positions={route} color="#9a0606ff" weight={2} />
      <Marker
        position={currentData.position}
        icon={createTruckIcon(deviceId, currentData.status)}
        ref={(el) => (truckMarkerRefs.current[deviceId] = el)}
      >
        
        <Popup>
          <div>
            <strong style={{ fontSize: "1rem" }}>
              {deviceId.replace(/device[-_]?/i, "Truck ")}
            </strong>

            {activeTab === "inTransit" && selectedCustomerPosition ? (
              <>
                <br />
                <strong>Status:</strong> {currentData.status}
                {currentData.status === "Stopped"}
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
                {formatDateTime(etas[deviceId]) || "Calculating..."}
                <br />
                <strong>Last Update:</strong>{" "}
                {formatDateTime(currentData.lastRecordedAt)}
                <br />
                <strong>Delivery Incharge:</strong>{" "}
                {selectedCustomerInfo?.driver || "N/A"}
              </>
            ) : activeTab === "completed" && selectedCustomerInfo ? (
              <>
                <br />
                <strong>Delivered:</strong>{" "}
                {formatDateTime(selectedCustomerInfo.completed_time)}
                <br />
                <strong>Delivery Incharge:</strong>{" "}
                {selectedCustomerInfo.driver}
              </>
            ) : activeTab === "cancelled" && selectedCustomerInfo ? (
              <>
                <br />
                <strong>Cancelled:</strong>{" "}
                {formatDateTime(selectedCustomerInfo.cancelled_time)}
                <br />
                <strong>Delivery Incharge:</strong>{" "}
                {selectedCustomerInfo.driver}
                <br />
                <strong>Reason:</strong> {selectedCustomerInfo.cancelled_reason}
              </>
            ) : null}
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
