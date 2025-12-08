import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Tabs, Tab } from "react-bootstrap";
import OperationalLayout from "./OperationalLayout";
import axios from "axios";
import { BsExclamationCircleFill, BsCheckCircleFill } from "react-icons/bs";
import { FaFilter } from "react-icons/fa";
import { Toaster } from "sonner";
import { ToastHelper } from "./helpers/ToastHelper";
import { HiQuestionMarkCircle } from "react-icons/hi";

const OperationalDelivery = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [personnelList, setPersonnelList] = useState([]);
  const [activeTab, setActiveTab] = useState("unassigned");
  const [filterDate, setFilterDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [deviceList, setDeviceList] = useState([]);
  const [showFAQ, setShowFAQ] = useState(false);
  const [activeFAQIndex, setActiveFAQIndex] = useState(null);

  // QBE state (added)
  const [showQbeModal, setShowQbeModal] = useState(false);
  const [qbeName, setQbeName] = useState("");
  const [qbeAddress, setQbeAddress] = useState("");
  const [qbeTracking, setQbeTracking] = useState("");
  const [qbePaymentMode, setQbePaymentMode] = useState("");
  const [qbeAssignedPersonnel, setQbeAssignedPersonnel] = useState("");
  const [qbeItems, setQbeItems] = useState("");
  const [qbeTotal, setQbeTotal] = useState("");

  const guideqst = [
    {
      question: "How can I assign deliveries to delivery personnel?",
      answer:
        "Go to the 'Unassigned Orders' tab inside the Delivery Details page, then click the 'Assign Now' button. Within the transaction details, click the 'Assign Delivery Personnel' button to select and assign the designated delivery personnel and delivery truck for that transaction.",
    },
    {
      question:
        "How can I update the assigned delivery personnel in a transaction?",
      answer:
        "Navigate to the 'Assigned Orders' tab and click the 'View Details' button. Inside the transaction details, click the 'Change Personnel' button to update the assigned delivery personnel and/or delivery truck for that specific transaction.",
    },
    {
      question:
        "What happens if a delivery is assigned to the wrong personnel and the personnel has already left?",
      answer:
        "This situation is beyond the system’s control, as it requires direct communication with the delivery personnel involved since they are the account holder responsible for the delivery.",
    },
  ];

  useEffect(() => {
    document.title = "Operational Delivery";
    fetchOrders();
  }, []);

  const formatPeso = (value) => {
    if (value === null || value === undefined || isNaN(value)) return "₱0.00";
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(value);
  };

  useEffect(() => {
    if (showModal) {
      fetchPersonnel();
      fetchDevices();
    }
  }, [showModal]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(
        "http://localhost/DeliveryTrackingSystem/fetch_delivery_orders.php"
      );
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
    }
  };

  const fetchPersonnel = async () => {
    try {
      const res = await axios.get(
        "http://localhost/DeliveryTrackingSystem/fetch_delivery_personnel.php"
      );
      if (res.data.success && Array.isArray(res.data.data)) {
        setPersonnelList(res.data.data);
      } else {
        setPersonnelList([]);
      }
    } catch (error) {
      console.error("Failed to fetch personnel:", error);
      setPersonnelList([]);
    }
  };

  const fetchDevices = async () => {
    try {
      const res = await axios.get(
        "http://localhost/DeliveryTrackingSystem/fetch_device_ids.php"
      );
      if (Array.isArray(res.data)) {
        const uniqueDevices = res.data.filter(
          (v, i, a) => a.findIndex((t) => t.device_id === v.device_id) === i
        );
        setDeviceList(uniqueDevices);
      } else {
        setDeviceList([]);
      }
    } catch (error) {
      console.error("Failed to fetch devices:", error);
      setDeviceList([]);
    }
  };

  const handleOpenAssignModal = () => {
    setSelectedPersonnel("");
    setShowModal(true);
  };

  const handleAssignPersonnel = async () => {
    if (!selectedPersonnel) {
      ToastHelper.error("Please select a delivery personnel.");
      return;
    }

    if (!deviceId) {
      ToastHelper.error("Please select a device ID.");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost/DeliveryTrackingSystem/assign_personnel.php",
        {
          transaction_id: selectedOrder.transaction_id,
          personnelUsername: selectedPersonnel,
          device_id: deviceId.trim(),
        }
      );

      if (res.data.success) {
        ToastHelper.success("Personnel and device assigned successfully!");
        setShowModal(false);
        setShowDetailModal(false);
        setSelectedOrder(null);
        setDeviceId("");
        fetchOrders();
      } else {
        ToastHelper.error(
          "Assignment failed: " + (res.data.message || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Assignment failed:", error);
      ToastHelper.error("Assignment failed. Please try again later.");
    }
  };

  const openDetailModal = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  // --- helpers for QBE matching ---
  const safe = (v) => (v == null ? "" : String(v));
  const contains = (hay, needle) =>
    safe(hay).toLowerCase().includes(safe(needle).toLowerCase());

  // parse total input for optional operator (>, <, >=, <=, =)
  const parseTotalQuery = (raw) => {
    const s = safe(raw).trim();
    const m = s.match(/^\s*([<>]=?|=)?\s*([0-9,\.]+)\s*$/);
    if (!m) return { op: null, num: null, raw: s.toLowerCase() };
    return {
      op: m[1] || "=",
      num: parseFloat(m[2].replace(/,/g, "")),
      raw: s.toLowerCase(),
    };
  };

  // QBE filter function (AND across provided fields)
  const applyQBEFilter = (list) => {
    const nameQ = qbeName.trim().toLowerCase();
    const addrQ = qbeAddress.trim().toLowerCase();
    const trackQ = qbeTracking.trim().toLowerCase();
    const payQ = qbePaymentMode.trim().toLowerCase();
    const assignedQ = qbeAssignedPersonnel.trim().toLowerCase();
    const itemsQ = qbeItems.trim().toLowerCase();
    const totalQParsed = parseTotalQuery(qbeTotal);

    return list.filter((o) => {
      // name
      if (nameQ && !contains(o.customer_name, nameQ)) return false;

      // address: check common address fields and haystack
      if (addrQ) {
        const addrOk =
          contains(o.customer_address, addrQ) ||
          contains(o.delivery_address, addrQ) ||
          contains(o.city, addrQ) ||
          contains(o.barangay, addrQ);
        if (!addrOk) {
          // also check haystack of items/description/tracking etc
          const hay = [
            o.tracking_number,
            o.payment_mode,
            o.assigned_personnel,
            o.status,
            o.target_date_delivery,
            o.customer_name,
            o.customer_address,
          ]
            .concat(
              Array.isArray(o.items)
                ? o.items.map(
                    (it) =>
                      `${it.name || it.description || ""} ${it.quantity || ""}`
                  )
                : []
            )
            .join(" ");
          if (!hay.toLowerCase().includes(addrQ)) return false;
        }
      }

      // tracking
      if (trackQ && !contains(o.tracking_number, trackQ)) return false;

      // payment mode
      if (
        payQ &&
        !contains(o.payment_mode, payQ) &&
        !contains(o.mode_of_payment, payQ)
      )
        return false;

      // assigned personnel
      if (assignedQ && !contains(o.assigned_personnel, assignedQ)) return false;

      // items: search item names/descriptions/ types and item quantities
      if (itemsQ) {
        const itemsHay = Array.isArray(o.items)
          ? o.items
              .map(
                (it) =>
                  `${it.name || it.description || it.type || ""} ${
                    it.quantity || ""
                  }`
              )
              .join(" ")
          : safe(o.items);
        if (!itemsHay.toLowerCase().includes(itemsQ)) return false;
      }

      // total: numeric operator (>, <, >=, <=, =) support or substring match
      if (qbeTotal && qbeTotal.trim() !== "") {
        const eTotal =
          parseFloat(
            safe(o.total_cost || o.total || o.amount || 0).replace(
              /[^0-9.\-]+/g,
              ""
            )
          ) || 0;
        if (totalQParsed.num != null && totalQParsed.op) {
          switch (totalQParsed.op) {
            case ">":
              if (!(eTotal > totalQParsed.num)) return false;
              break;
            case ">=":
              if (!(eTotal >= totalQParsed.num)) return false;
              break;
            case "<":
              if (!(eTotal < totalQParsed.num)) return false;
              break;
            case "<=":
              if (!(eTotal <= totalQParsed.num)) return false;
              break;
            case "=":
            default:
              if (!(Math.abs(eTotal - totalQParsed.num) < 0.0001)) return false;
          }
        } else {
          const hay = (
            safe(o.total_cost) +
            " " +
            safe(o.total) +
            " " +
            safe(o.customer_name) +
            " " +
            safe(o.tracking_number)
          ).toLowerCase();
          if (!hay.includes(totalQParsed.raw)) return false;
        }
      }

      return true;
    });
  };

  // Derived lists (unchanged logic, QBE applied after searchTerm filtering)
  const unassignedOrders = orders
    .filter((o) => !o.assigned_personnel || o.assigned_personnel === null)
    .sort(
      (a, b) =>
        new Date(a.target_date_delivery) - new Date(b.target_date_delivery)
    );

  const assignedOrders = orders
    .filter(
      (o) =>
        o.assigned_personnel &&
        o.assigned_personnel !== null &&
        o.status !== "Delivered" &&
        o.status !== "Cancelled"
    )
    .sort(
      (a, b) =>
        new Date(a.target_date_delivery) - new Date(b.target_date_delivery)
    );

  const searchedUnassignedOrders = unassignedOrders.filter((order) => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    const assignedText = "not assigned";
    return (
      String(order.transaction_id || "")
        .toLowerCase()
        .includes(search) ||
      (order.customer_name || "").toLowerCase().includes(search) ||
      assignedText.toLowerCase().includes(search) ||
      (order.status || "").toLowerCase().includes(search) ||
      String(order.tracking_number || "")
        .toLowerCase()
        .includes(search) ||
      (order.target_date_delivery || "").toLowerCase().includes(search)
    );
  });

  const searchedAssignedOrders = assignedOrders.filter((order) => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      String(order.transaction_id || "")
        .toLowerCase()
        .includes(search) ||
      (order.customer_name || "").toLowerCase().includes(search) ||
      (order.assigned_personnel || "").toLowerCase().includes(search) ||
      (order.status || "").toLowerCase().includes(search) ||
      String(order.tracking_number || "")
        .toLowerCase()
        .includes(search) ||
      (order.target_date_delivery || "").toLowerCase().includes(search)
    );
  });

  // Apply QBE if any QBE field is set
  const hasQBE =
    qbeName ||
    qbeAddress ||
    qbeTracking ||
    qbePaymentMode ||
    qbeAssignedPersonnel ||
    qbeItems ||
    qbeTotal;

  let finalUnassigned = searchedUnassignedOrders;
  let finalAssigned = searchedAssignedOrders;

  if (hasQBE) {
    finalUnassigned = applyQBEFilter(searchedUnassignedOrders);
    finalAssigned = applyQBEFilter(searchedAssignedOrders);
  }

  const filteredUnassignedOrders = filterDate
    ? finalUnassigned.filter((o) => o.target_date_delivery === filterDate)
    : finalUnassigned;

  const filteredAssignedOrders = filterDate
    ? finalAssigned.filter((o) => o.target_date_delivery === filterDate)
    : finalAssigned;
const [userPermissions, setUserPermissions] = useState({});

useEffect(() => {
  axios
    .get(
      "http://localhost/DeliveryTrackingSystem/get_current_user_permission.php",
      { withCredentials: true }
    )
    .then((res) => {
      if (res.data.success) {
        setUserPermissions(res.data.permissions || {});
      } else {
        setUserPermissions({});
      }
    })
    .catch((err) => console.error("Error fetching permissions:", err));
}, []);

  return (
    <>
      <Toaster position="top-center" richColors />
      <OperationalLayout
        title={
          <div className="d-flex align-items-center gap-2">
            <span>Delivery Orders</span>
            <HiQuestionMarkCircle
              style={{
                fontSize: "2rem",
                color: "#07720885",
                cursor: "pointer",
                marginLeft: "10px",
              }}
              onClick={() => setShowFAQ(true)}
            />
          </div>
        }
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      >
        <div className="compact-container container mt-5 pb-5 px-5 rounded-2">
          <div className="d-flex justify-content-between align-items-center mb-5">
            <div className="flex-grow-1">
              <Tabs
                id="delivery-tabs"
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="fw-bold"
              >
                <Tab
                  eventKey="unassigned"
                  title={
                    <span className="d-flex align-items-center">
                      <BsExclamationCircleFill className="me-2" /> Unassigned
                      Orders
                    </span>
                  }
                />
                <Tab
                  eventKey="assigned"
                  title={
                    <span className="d-flex align-items-center">
                      <BsCheckCircleFill className="me-2" /> Assigned Orders
                    </span>
                  }
                />
              </Tabs>
            </div>

            <div className="d-flex align-items-center ms-3">
              <Button
                className="me-3 btn-view py-2 px-3 fs-6"
                // variant="outline-primary"
                size="sm"
                onClick={() => setShowQbeModal(true)}
              >
                <FaFilter /> {"  "}
                Advanced Filter
              </Button>

              <Form.Control
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                style={{ width: "180px", height: "38px" }}
              />
              {filterDate && (
                <Button
                  variant="success"
                  size="sm"
                  className="ms-2"
                  onClick={() => setFilterDate("")}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div className="tab-content">
            {activeTab === "unassigned" && (
              <div className="row">
                {filteredUnassignedOrders.length === 0 ? (
                  <div className="col-12 text-center text-muted my-3">
                    {searchTerm ? (
                      <h6>
                        No matching unassigned orders found.
                        {filterDate ? ` on ${filterDate}` : ""}
                      </h6>
                    ) : filterDate ? (
                      <h6>No unassigned transactions found on {filterDate}</h6>
                    ) : (
                      <h6>All orders are already assigned</h6>
                    )}
                  </div>
                ) : (
                  filteredUnassignedOrders.map((order, index) => (
                    <div key={index} className="col-md-6 mb-4">
                      <div className="delivery compact-card card rounded-2 p-3 m-2 border border-danger">
                        <h5 className="fw-bold text-danger">
                          Transaction No. {order.transaction_id}
                        </h5>
                        <p className="mb-2 text-danger">
                          <strong>Delivery Date: </strong>
                          {order.target_date_delivery}
                        </p>
                        <p className="mb-2">
                          <strong>Customer:</strong> {order.customer_name}
                        </p>
                        <p className="mb-2 text-danger">
                          <strong>Delivery Personnel:</strong>{" "}
                          <span className="fw-semibold">Not Assigned</span>
                        </p>
                        <p className="mb-2">
                          <strong>Status:</strong> {order.status}
                        </p>
                        <div className="action-btn d-flex justify-content-between align-items-center">
                          <p className="mb-2">
                            <strong>Tracking No.</strong>{" "}
                            {order.tracking_number}
                          </p>
                          <Button
                            className="btn btn-view px-3 py-1"
                            size="sm"
                            variant="danger"
                            onClick={() => openDetailModal(order)}
                          >
                            Assign Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "assigned" && (
              <div className="row">
                {filteredAssignedOrders.length === 0 ? (
                  <div className="col-12 text-center text-muted my-3">
                    {searchTerm ? (
                      <h6>
                        No matching assigned orders found.
                        {filterDate ? ` on ${filterDate}` : ""}
                      </h6>
                    ) : filterDate ? (
                      <h6>No assigned transactions found on {filterDate}</h6>
                    ) : (
                      <h6>No orders have been assigned yet.</h6>
                    )}
                  </div>
                ) : (
                  filteredAssignedOrders.map((order, index) => (
                    <div key={index} className="col-md-6 mb-4">
                      <div className="delivery compact-card card rounded-2 p-3 m-2 border border-success">
                        <h5 className="fw-bold text-success">
                          Transaction No. {order.transaction_id}
                        </h5>
                        <p className="mb-2 text-success">
                          <strong>Delivery Date: </strong>
                          {order.target_date_delivery}
                        </p>
                        <p className="mb-2">
                          <strong>Customer:</strong> {order.customer_name}
                        </p>
                        <p className="mb-2">
                          <strong>Delivery Personnel:</strong>{" "}
                          <span className="text-success fw-semibold">
                            {order.assigned_personnel}
                          </span>
                        </p>
                        <p className="mb-2">
                          <strong>Status:</strong> {order.status}
                        </p>
                        <p className="mb-2 text-success">
                          <strong>Truck Device:</strong>{" "}
                          {order.device_id
                            ? order.device_id.replace(/device[-_]?/i, "Truck ")
                            : "Not Assigned"}
                        </p>
                        <div className="action-btn d-flex justify-content-between align-items-center">
                          <p className="mb-2">
                            <strong>Tracking No.</strong>{" "}
                            {order.tracking_number}
                          </p>

                          {userPermissions["View Delivery Details"] !== 0 && (
                            <Button
                              className="btn btn-view px-3 py-1"
                              size="sm"
                              onClick={() => openDetailModal(order)}
                            >
                              View Details
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {selectedOrder && (
            <Modal
              show={showDetailModal}
              onHide={() => setShowDetailModal(false)}
              size="lg"
              centered
              dialogClassName={showModal ? "dimmed-modal" : ""}
            >
              <Modal.Header closeButton>
                <Modal.Title className="fw-bold text-success text-center">
                  Transaction #{selectedOrder.transaction_id}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div className="p-3 bg-white border rounded-3">
                  <h5 className="text-success">Customer Details</h5>
                  <p>
                    <strong>Name:</strong> {selectedOrder.customer_name}
                  </p>
                  <p>
                    <strong>Address:</strong> {selectedOrder.customer_address}
                  </p>
                  <p>
                    <strong>Contact:</strong> {selectedOrder.contact_number}
                  </p>
                  <p>
                    <strong>Payment Mode:</strong> {selectedOrder.payment_mode}
                  </p>
                  <p>
                    <strong>Status:</strong> {selectedOrder.status}
                  </p>
                  <p>
                    <strong>Tracking No. </strong>{" "}
                    {selectedOrder.tracking_number}
                  </p>
                  <p>
                    <strong>Delivery Date: </strong>{" "}
                    {selectedOrder.target_date_delivery}
                  </p>
                </div>

                <div className="p-3 mt-3 bg-white border rounded-3">
                  <h5 className="text-success">Items Ordered</h5>
                  <ul className="list-group list-group-flush fw-semibold">
                    {Array.isArray(selectedOrder.items) &&
                    selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item, idx) => (
                        <li
                          key={idx}
                          className="list-group-item d-flex justify-content-between"
                        >
                          <div>
                            {item.name} x{item.quantity}
                            <br />
                            <small className="text-muted">
                              Unit Cost: {formatPeso(item.unit_cost)}
                            </small>
                          </div>
                          <span className="fw-bold">
                            {formatPeso(item.total_cost)}
                          </span>
                        </li>
                      ))
                    ) : (
                      <li className="list-group-item text-muted">
                        No items found.
                      </li>
                    )}
                  </ul>

                  <div className="text-end mt-3">
                    <h5 className="fw-bold text-success">
                      Total Cost: {formatPeso(selectedOrder.total_cost)}
                    </h5>
                  </div>
                </div>

                {selectedOrder.assigned_personnel ? (
                  <div className="p-3 mt-3 bg-white border rounded-3">
                    <ul className="list-group">
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        <span className="fw-bold text-success">
                          Delivery Personnel Assigned:
                        </span>
                        <div className="d-flex align-items-center">
                          <b className="me-3">
                            {selectedOrder.assigned_personnel}
                          </b>
                          <img
                            src={
                              selectedOrder?.personnel_image &&
                              selectedOrder.personnel_image.trim() !== ""
                                ? selectedOrder.personnel_image
                                : "http://localhost/DeliveryTrackingSystem/uploads/default-profile-pic.png"
                            }
                            alt={
                              selectedOrder?.assigned_personnel ||
                              "Delivery Personnel"
                            }
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "http://localhost/DeliveryTrackingSystem/uploads/default-profile-pic.png";
                            }}
                            className="rounded-circle border border-2 border-dark"
                            style={{
                              width: "60px",
                              height: "60px",
                              objectFit: "cover",
                            }}
                          />
                        </div>
                      </li>
                    </ul>

                    {(selectedOrder.status === "Pending" ||
                      selectedOrder.status === "To Ship") &&
                      userPermissions["Assign Delivery"] !== 0 && (
                        <div className="text-center mt-3">
                          <Button
                            variant="warning"
                            className="btn btn-view px-3 py-1 rounded-2"
                            onClick={handleOpenAssignModal}
                          >
                            Change Personnel
                          </Button>
                        </div>
                      )}
                  </div>
                ) : (
                  /* Assign Personnel Button (only if user has permission) */
                  (selectedOrder.status === "Pending" ||
                    selectedOrder.status === "To Ship") &&
                  userPermissions["Assign Delivery"] !== 0 && (
                    <div className="text-center mt-4">
                      <Button
                        variant="success"
                        className="btn btn-view px-3 py-1"
                        onClick={handleOpenAssignModal}
                      >
                        Assign Delivery Personnel
                      </Button>
                    </div>
                  )
                )}
              </Modal.Body>
            </Modal>
          )}

          <Modal show={showModal} onHide={() => setShowModal(false)} centered>
            <Modal.Header className="bg-light" closeButton>
              <Modal.Title className="fw-bold text-success">
                {selectedOrder?.assigned_personnel
                  ? "Reassign Personnel"
                  : "Assign Delivery Personnel"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>
                  <strong>Available Personnel:</strong>
                </Form.Label>
                <Form.Select
                  value={selectedPersonnel}
                  onChange={(e) => setSelectedPersonnel(e.target.value)}
                  disabled={personnelList.length === 0}
                >
                  <option value="">
                    {personnelList.length === 0
                      ? "No available personnel"
                      : "Select personnel..."}
                  </option>
                  {personnelList.map((p, i) => (
                    <option key={i} value={p.pers_username}>
                      {p.pers_fname} {p.pers_lname}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label>
                  <strong>Available Devices:</strong>
                </Form.Label>
                <Form.Select
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  disabled={deviceList.length === 0}
                >
                  <option value="">
                    {deviceList.length === 0
                      ? "No available devices"
                      : "Select device..."}
                  </option>
                  {deviceList.map((d, i) => (
                    <option key={i} value={d.device_id}>
                      {d.device_id.replace(/device[-_]?/i, "Truck ")}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer className="bg-light">
              <Button
                className={`add-btn py-1 px-3 fw-normal border border-success rounded-2 ${
                  selectedOrder?.assigned_personnel
                    ? "btn-warning"
                    : "bg-success"
                }`}
                onClick={handleAssignPersonnel}
              >
                {selectedOrder?.assigned_personnel ? "Re-assign" : "Assign"}
              </Button>
            </Modal.Footer>
          </Modal>
        </div>

        {/* QBE Modal (added) */}
        <Modal
          show={showQbeModal}
          onHide={() => setShowQbeModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Advanced Filter (QBE)</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-2">
              <Form.Label>Customer Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Customer name"
                value={qbeName}
                onChange={(e) => setQbeName(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Address</Form.Label>
              <Form.Control
                type="text"
                placeholder="Address or city"
                value={qbeAddress}
                onChange={(e) => setQbeAddress(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Tracking No.</Form.Label>
              <Form.Control
                type="text"
                placeholder="Tracking number"
                value={qbeTracking}
                onChange={(e) => setQbeTracking(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Payment Mode</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Cash, Bank Transfer"
                value={qbePaymentMode}
                onChange={(e) => setQbePaymentMode(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Assigned Personnel</Form.Label>
              <Form.Control
                type="text"
                placeholder="Personnel username or name"
                value={qbeAssignedPersonnel}
                onChange={(e) => setQbeAssignedPersonnel(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Items (name/description)</Form.Label>
              <Form.Control
                type="text"
                placeholder="Item description or type"
                value={qbeItems}
                onChange={(e) => setQbeItems(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Total Cost</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. >1000 or 1000"
                value={qbeTotal}
                onChange={(e) => setQbeTotal(e.target.value)}
              />
              <Form.Text className="text-muted">
                You can use operators: &gt; &lt; &gt;= &lt;= or exact number.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              className="cancel-btn py-2 rounded rounded-2 px-2"
              variant="secondary"
              onClick={() => setShowQbeModal(false)}
            >
              Cancel
            </Button>
            <Button
              // className="btn secondary-outline"
              variant="outline-secondary"
              onClick={() => {
                setQbeName("");
                setQbeAddress("");
                setQbeTracking("");
                setQbePaymentMode("");
                setQbeAssignedPersonnel("");
                setQbeItems("");
                setQbeTotal("");
              }}
            >
              Clear
            </Button>
            <Button
              className="add-btn py-2 px-3"
              variant="success"
              onClick={() => {
                setShowQbeModal(false); /* filtering is reactive */
              }}
            >
              Apply
            </Button>
          </Modal.Footer>
        </Modal>

        {/* FAQ Modal (unchanged) */}
        <Modal
          show={showFAQ}
          onHide={() => {
            setShowFAQ(false);
            setActiveFAQIndex(null);
          }}
          centered
          dialogClassName="faq-modal-dialog"
        >
          <Modal.Header
            closeButton
            style={{
              backgroundColor: "#116B8A",
              color: "white",
              borderBottom: "none",
            }}
          >
            <Modal.Title>Guide for Delivery Orders</Modal.Title>
          </Modal.Header>

          <Modal.Body style={{ backgroundColor: "#f8f9fa" }}>
            <p className="px-3 text-justify mb-4" style={{ color: "#333" }}>
              The Delivery Orders page allows you to manage all delivery
              transactions. You can view orders under the “Unassigned Orders” or
              “Assigned Orders” tabs. From here, you can assign delivery
              personnel and trucks, or reassign deliveries when necessary. This
              page helps ensure that all delivery operations are properly
              assigned and organized.
            </p>

            <div className="px-3 mb-3">
              <div className="accordion" id="faqAccordion">
                {guideqst.map((faq, index) => (
                  <div
                    className="accordion-item mb-3 shadow-sm border-0"
                    key={index}
                  >
                    <h2 className="accordion-header" id={`heading${index}`}>
                      <button
                        className={`accordion-button ${
                          activeFAQIndex === index ? "" : "collapsed"
                        }`}
                        type="button"
                        onClick={() =>
                          setActiveFAQIndex(
                            activeFAQIndex === index ? null : index
                          )
                        }
                        aria-expanded={activeFAQIndex === index}
                        aria-controls={`collapse${index}`}
                        style={{
                          backgroundColor:
                            activeFAQIndex === index ? "#116B8A" : "#e9f6f8",
                          color: activeFAQIndex === index ? "white" : "#116B8A",
                          fontWeight: 600,
                          transition: "all 0.3s ease",
                        }}
                      >
                        {faq.question}
                      </button>
                    </h2>
                    <div
                      id={`collapse${index}`}
                      className={`accordion-collapse collapse ${
                        activeFAQIndex === index ? "show" : ""
                      }`}
                      aria-labelledby={`heading${index}`}
                      data-bs-parent="#faqAccordion"
                    >
                      <div
                        className="accordion-body bg-white rounded-bottom"
                        style={{
                          borderLeft: "4px solid #116B8A",
                          color: "#333",
                          fontSize: "0.95rem",
                        }}
                      >
                        <strong>Answer:</strong> {faq.answer}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer
            style={{
              backgroundColor: "#f8f9fa",
              borderTop: "1px solid #dee2e6",
            }}
          >
            <Button
              onClick={() => {
                setShowFAQ(false);
                setActiveFAQIndex(null);
              }}
              className="close-btn px-4 py-2 fs-6 rounded-2"
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </OperationalLayout>
    </>
  );
};

export default OperationalDelivery;
