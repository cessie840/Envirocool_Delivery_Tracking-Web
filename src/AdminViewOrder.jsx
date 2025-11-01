import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import AdminLayout from "./AdminLayout";
import UpdateOrderModal from "./UpdateOrderModal";
import RescheduleModal from "./RescheduleModal";
import { Button, Modal, Form } from "react-bootstrap";
import { ToastHelper } from "./helpers/ToastHelper";

const ViewOrder = () => {
  const navigate = useNavigate();
  const { transaction_id } = useParams();
  const [orderDetails, setOrderDetails] = useState(null);
  const [editableItems, setEditableItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const [currentIndex, setCurrentIndex] = useState(0);

  const [formData, setFormData] = useState({
    transaction_id: "",
    tracking_number: "",
    customer_name: "",
    customer_address: "",
    customer_contact: "",
    date_of_order: "",
    target_date_delivery: "",
    dbilling_date: "",
    mode_of_payment: "",
    payment_option: "",
    down_payment: "",
    balance: "",
    total: "",
    proof_of_delivery: "",
    full_payment: "0",
    fbilling_date: "",
    payments: [],
  });

  const [showProofViewModal, setShowProofViewModal] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [modalTitle, setModalTitle] = useState("");

  const refetchData = () => {
    setRefetchTrigger((prev) => prev + 1); 
  };

  const openProofModal = (url, title) => {
    let normalized = url;
    if (typeof url === "string" && url.startsWith("[")) {
      try {
        normalized = JSON.parse(url);
      } catch {
        normalized = [url];
      }
    } else if (!Array.isArray(url)) {
      normalized = [url];
    }
    setProofUrl(normalized);
    setModalTitle(title);
    setShowProofViewModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  const fetchOrderDetails = () => {
    fetch(
      `http://localhost/DeliveryTrackingSystem/view_deliveries.php?transaction_id=${transaction_id}&_=${Date.now()}`,
      {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
        },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched data:", data);

        const parsedPayments = Array.isArray(data.payments)
          ? data.payments
          : (() => {
              try {
                return JSON.parse(data.payments || "[]");
              } catch {
                return [];
              }
            })();

        setOrderDetails({
          ...data,
          payments: parsedPayments,
        });

        setFormData({
          transaction_id: data.transaction_id || transaction_id,
          tracking_number: data.tracking_number,
          customer_name: data.customer_name,
          customer_address: data.customer_address,
          customer_contact: data.customer_contact,
          date_of_order: formatDate(data.date_of_order),
          mode_of_payment: data.mode_of_payment,
          payment_option: data.payment_option,
          down_payment: data.down_payment,
          balance: data.balance,
          total: data.total,
          target_date_delivery: formatDate(data.target_date_delivery),
          dbilling_date: formatDate(data.dbilling_date),
          proof_of_delivery: data.proof_of_delivery,
          full_payment: data.full_payment || "0",
          fbilling_date: data.fbilling_date || "",
          payments: parsedPayments,
        });
      })
      .catch((err) => {
        console.error("Failed to fetch order:", err);
      });
  };

  useEffect(() => {
    document.title = "View Order Details";
    fetchOrderDetails();
  }, [transaction_id, refetchTrigger]);

  const handleUpdate = () => {
    if (!orderDetails || !orderDetails.transaction_id) {
      ToastHelper.error(
        "Cannot update: Transaction ID is missing. Please refresh and try again."
      );
      return;
    }

    const fixedItems = orderDetails.items.map((item) => ({
      quantity: item.quantity,
      type_of_product: item.type_of_product || item.product_type || "",
      description: item.description || item.item_name || "",
      unit_cost: item.unit_cost,
    }));

    setFormData({
      transaction_id: orderDetails.transaction_id,
      payment_option: orderDetails.payment_option,
      down_payment: orderDetails.down_payment,
      full_payment: orderDetails.full_payment,
      fbilling_date: orderDetails.fbilling_date,
      balance: orderDetails.balance,
      total: orderDetails.total,
      payments: orderDetails.payments || [],
    });

    setEditableItems(fixedItems);
    setShowModal(true);
  };

  const handleRescheduleUpdate = (newDate) => {
    setOrderDetails((prev) => ({
      ...prev,
      target_date_delivery: formatDate(newDate),
      status: "Pending",
      cancelled_reason: null,
    }));
  };

  const handleClose = () => setShowModal(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const hasInvalidQuantity = editableItems.some((item) => item.quantity < 1);
    if (hasInvalidQuantity) {
      ToastHelper.error("One or more items have invalid quantity.");
      return;
    }

    if (!/^09\d{9}$/.test(formData.customer_contact)) {
      ToastHelper.error(
        "Contact number must start with '09' and be exactly 11 digits."
      );
      return;
    }

    const formatDateForDB = (dateString) => {
      if (!dateString || dateString === "-") return null;
      const [mm, dd, yyyy] = dateString.split("/");
      return `${yyyy}-${mm}-${dd}`;
    };

    const payload = {
      transaction_id,
      ...formData,
      date_of_order: formatDateForDB(formData.date_of_order),
      target_date_delivery: formatDateForDB(formData.target_date_delivery),
      fbilling_date: formData.fbilling_date,
      dbilling_date: formData.dbilling_date,
      items: editableItems,
    };

    fetch("http://localhost/DeliveryTrackingSystem/update_delivery.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((response) => {
        if (response.status === "success") {
          ToastHelper.success("Update successful!", {
            duration: 2500,
            style: {
              background: "#EBFAECFF",
              border: "1px solid #91C793FF",
              color: "#2E7D32",
              fontWeight: 600,
              fontSize: "1.1rem",
              textAlign: "center",
              width: "100%",
              maxWidth: "600px",
              margin: "0 auto",
              justifyContent: "center",
              borderRadius: "8px",
            },
          });
          setOrderDetails((prev) => ({
            ...prev,
            ...formData,
            items: editableItems,
          }));
          setOrderDetails((prev) => ({
            ...prev,
            ...formData,
            items: editableItems,
          }));

          setTimeout(() => {
            setRefetchTrigger((prev) => prev + 1);
          }, 500);
        } else {
          console.error("Update failed:", response.message);
          ToastHelper.error(
            "Update failed: " + (response.message || "Unknown error")
          );
        }
      })
      .catch((err) => {
        console.error("Update error:", err);
        ToastHelper.error("An error occurred.");
      });
  };

  if (!orderDetails) return <p className="text-center mt-5">Loading...</p>;

  const totalCost = (orderDetails?.items || []).reduce(
    (sum, item) => sum + item.quantity * item.unit_cost,
    0
  );

  const calculatedBalance =
    parseFloat(orderDetails?.balance) ??
    totalCost -
      (parseFloat(orderDetails?.down_payment) || 0) -
      (parseFloat(orderDetails?.full_payment) || 0);

  const renderStatusBadge = (status) => {
    switch (status) {
      case "Delivered":
        return <strong style={{ color: "#327229" }}>{status}</strong>;
      case "Cancelled":
        return <strong style={{ color: "#DC3545" }}>{status}</strong>;
      case "Out for Delivery":
        return <strong style={{ color: "#2193C0FF" }}>{status}</strong>;
      case "Pending":
        return <strong style={{ color: "#ECAE62FF" }}>{status}</strong>;
      default:
        return <strong>{status}</strong>;
    }
  };

  return (
    <AdminLayout title="View Order Details" showSearch={false}>
      <div className="d-flex justify-content-start mt-4 ms-4">
        <button
          className="back-btn btn-success d-flex align-items-center gap-2"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft /> Back
        </button>
      </div>

      <div className="container mt-4 w-75">
        <div className="view-order card shadow-lg border-0 rounded-4">
          <div className="view-order card-body">
            <div className="d-flex justify-content-between align-items-center mt-3 mb-3">
              <h3 className="card-title fw-bold text-success">
                Transaction No. {transaction_id}
              </h3>
              <h3 className="card-title fw-bold text-success">
                Tracking No. {orderDetails.tracking_number}
              </h3>
            </div>

            <div className="m-2 p-3 bg-white border rounded-3 shadow-sm">
              <div className="row">
                <div className="col-md-6 order-1 order-md-1">
                  <h5 className="text-success fw-bold">Client Details</h5>
                  <p>
                    <span>Name:</span> {orderDetails.customer_name}
                  </p>
                  <p>
                    <span>Address:</span> {orderDetails.customer_address}
                  </p>
                  <p>
                    <span>Contact:</span> {orderDetails.customer_contact}
                  </p>
                  <p>
                    <span>Date of Order:</span>{" "}
                    {formatDate(orderDetails.date_of_order)}
                  </p>
                  <p>
                    <span>Target Delivery Date: </span>
                    {formatDate(orderDetails.target_date_delivery)}
                  </p>
                  <p>
                    <span>Payment Due Date: </span>
                    {formatDate(orderDetails.dbilling_date)}
                  </p>
                  {orderDetails.rescheduled_date && (
                    <p>
                      <span>Rescheduled Delivery Date: </span>
                      {formatDate(orderDetails.rescheduled_date)}
                    </p>
                  )}

                  <br />
                  <h5 className="text-success fw-bold">Delivery Status</h5>
                  <p>
                    <span>Current Delivery Status: </span>
                    {renderStatusBadge(orderDetails.status)}
                  </p>
                  {orderDetails.status === "Cancelled" &&
                    orderDetails.cancelled_reason && (
                      <p>
                        <span>Cancellation Reason: </span>
                        <strong className="text-danger">
                          {orderDetails.cancelled_reason}
                        </strong>
                      </p>
                    )}
                </div>

                <div className="col-md-6 order-2 order-md-2">
                  <h5 className="text-success fw-bold">Payment Details</h5>

                  <p>
                    <span>Payment Method:</span>{" "}
                    {orderDetails.mode_of_payment || "—"}
                  </p>
                  <p>
                    <span>Payment Option:</span>{" "}
                    {orderDetails.payment_option || "—"}
                  </p>
                  <p>
                    <span>Total:</span> ₱
                    {Number(orderDetails?.total || 0).toLocaleString()}
                  </p>

                  {orderDetails.payment_option !== "Full Payment" && (
                    <>
                      <span className="fw-bold text-success mb-2">
                        Payment History
                      </span>

                      <ul className="list-group shadow-sm mb-3 rounded-3">
                        {orderDetails.down_payment &&
                          parseFloat(orderDetails.down_payment) > 0 && (
                            <li className="list-group-item d-flex justify-content-between align-items-center bg-light">
                              <div>
                                <strong>Initial Down Payment</strong>
                                <br />
                                <p className="text-dark fs-6 m-0">
                                  {formatDate(orderDetails.date_of_order)}
                                </p>
                              </div>
                              <p className="fw-semibold text-dark">
                                ₱
                                {parseFloat(
                                  orderDetails.down_payment
                                ).toLocaleString("en-PH", {
                                  minimumFractionDigits: 2,
                                })}
                              </p>
                            </li>
                          )}

                        {Array.isArray(orderDetails.payments) &&
                        orderDetails.payments.length > 0 ? (
                          orderDetails.payments.map((p, i) => (
                            <li
                              key={i}
                              className="list-group-item d-flex justify-content-between align-items-center"
                            >
                              <div>
                                <strong>
                                  {p.label || `Additional Payment`}
                                </strong>
                                <br />
                                <p className="text-dark fs-6 m-0">
                                  {formatDate(p.date)}
                                </p>
                              </div>
                              <p className="fw-semibold text-dark">
                                ₱
                                {parseFloat(p.amount).toLocaleString("en-PH", {
                                  minimumFractionDigits: 2,
                                })}
                              </p>
                            </li>
                          ))
                        ) : (
                          <li className="list-group-item text-muted text-center fs-6">
                            No additional payments yet.
                          </li>
                        )}
                      </ul>

                      <p>
                        <span className="fw-semibold">Remaining Balance: </span>
                          ₱
                          {calculatedBalance.toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                          })}
                      </p>

                      <p>
                        <span className="fw-semibold">Payment Status: </span>
                        {calculatedBalance === 0 ? (
                          <strong style={{ color: "#189721FF" }}>
                            Fully Paid
                          </strong>
                        ) : (
                          <strong style={{ color: "#F7B264FF" }}>
                            Partially Paid
                          </strong>
                        )}
                      </p>
                    </>
                  )}
                </div>

                <div className="col-md-12 order-3 order-md-3 mt-4">
                  <h5 className="text-success fw-bold">Transaction Proofs</h5>

                  {orderDetails.proof_of_payment && (
                    <div className="mb-2">
                      <button
                        className="btn btn-view py-2 px-3 fs-6 rounded-2"
                        onClick={() =>
                          openProofModal(
                            orderDetails.proof_of_payment,
                            "Proof of Payment"
                          )
                        }
                      >
                        View Proof of Payment
                      </button>
                    </div>
                  )}

                  {orderDetails.status === "Delivered" &&
                    orderDetails.proof_of_delivery && (
                      <div>
                        <button
                          className="btn add-btn py-2 px-3 fs-6 rounded-2"
                          onClick={() =>
                            openProofModal(
                              orderDetails.proof_of_delivery,
                              "Proof of Delivery"
                            )
                          }
                        >
                          View Proof of Delivery
                        </button>
                      </div>
                    )}
                </div>
              </div>
            </div>

            <div className="mx-2 my-3 p-3 bg-white border rounded-3 shadow-sm">
              <h5 className="text-success fw-bold">Items Ordered</h5>
              <ul className="list-group list-group-flush fw-semibold">
                {(orderDetails.items || []).map((item, index) => (
                  <li
                    key={index}
                    className="list-group-item d-flex justify-content-between align-items-center fw-semibold"
                  >
                    <div>
                      {item.type_of_product} {item.description} x{item.quantity}
                      <br />
                      <small className="text-muted fw-bold">
                        Unit Cost: ₱{Number(item.unit_cost).toLocaleString()}
                      </small>
                    </div>
                    <span className="fw-bold">
                      ₱{(item.unit_cost * item.quantity).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="d-flex justify-content-between align-items-center mt-4 px-3">
                <div>
                  {orderDetails.payment_option === "Down Payment" && (
                    <h4 className="fw-bold text-danger mb-0">
                      Remaining Balance: ₱{calculatedBalance.toLocaleString()}
                    </h4>
                  )}
                </div>

                <div>
                  <h4 className="fw-bold text-success text-end mb-0">
                    Total Cost: ₱{totalCost.toLocaleString()}
                  </h4>
                </div>
              </div>
            </div>

            <div className="buttons d-flex justify-content-center gap-5 mt-4">
              {!["Delivered", "Out for Delivery", "Cancelled"].includes(
                orderDetails.status
              ) &&
                (parseFloat(orderDetails.balance) > 0 ||
                  calculatedBalance > 0) && (
                  <button
                    className="btn upd-btn btn-success px-5 py-2 rounded-2"
                    onClick={handleUpdate}
                  >
                    Update Payment
                  </button>
                )}

              {orderDetails.status === "Cancelled" && (
                <button
                  className="btn btn-view px-5 py-2 rounded-3 fs-5"
                  onClick={() => setShowReschedule(true)}
                >
                  Reschedule
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Update Modal */}
      <UpdateOrderModal
        show={showModal}
        handleClose={handleClose}
        onSuccess={refetchData}
        formData={formData}
        setFormData={setFormData}
        editableItems={editableItems}
        setEditableItems={setEditableItems}
      />

      {/* Reschedule Modal */}
      <RescheduleModal
        show={showReschedule}
        handleClose={() => setShowReschedule(false)}
        transaction_id={transaction_id}
        onReschedule={(updatedFields) => {
          setOrderDetails((prev) => ({ ...prev, ...updatedFields }));
        }}
      />

<Modal
  show={showProofViewModal}
  onHide={() => setShowProofViewModal(false)}
  centered
  size="lg"
  className="proof-preview-modal"
>
  <Modal.Header
    closeButton
    style={{ backgroundColor: "#00628FFF", color: "white", opacity: 0.85 }}
  >
    <Modal.Title className="fw-semibold">
      {modalTitle || "Proof of Payment Preview"}
    </Modal.Title>
  </Modal.Header>

  <Modal.Body className="bg-light text-center">
    {!proofUrl || proofUrl.length === 0 ? (
      <div className="py-5">
        <i
          className="bi bi-file-earmark-image text-secondary"
          style={{ fontSize: "3rem" }}
        ></i>
        <p className="mt-3 text-muted fs-5">No images uploaded.</p>
      </div>
    ) : (
      <div className="position-relative d-flex align-items-center justify-content-center">
        {currentIndex > 0 && (
          <button
            onClick={() => setCurrentIndex(currentIndex - 1)}
            className="btn btn-light rounded-circle shadow position-absolute"
            style={{ left: "15px", zIndex: 10 }}
          >
            <FaChevronLeft size={20} />
          </button>
        )}

        <div
          className="bg-white rounded-3 shadow-sm d-flex align-items-center justify-content-center"
          style={{
            width: "600px",
            height: "600px",
            overflow: "hidden",
            border: "3px solid #ddd",
          }}
        >
          <img
            src={
              Array.isArray(proofUrl)
                ? proofUrl[currentIndex]
                : typeof proofUrl === "string"
                ? proofUrl.replace(/[\[\]"]/g, "").split(",")[currentIndex]
                : ""
            }
            alt={`Proof ${currentIndex + 1}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </div>

        {currentIndex <
          (Array.isArray(proofUrl)
            ? proofUrl.length - 1
            : typeof proofUrl === "string" && proofUrl.startsWith("[")
            ? JSON.parse(proofUrl).length - 1
            : 0) && (
          <button
            onClick={() => setCurrentIndex(currentIndex + 1)}
            className="btn btn-light rounded-circle shadow position-absolute"
            style={{ right: "15px", zIndex: 10 }}
          >
            <FaChevronRight size={20} />
          </button>
        )}
      </div>
    )}
  </Modal.Body>

  <Modal.Footer className="bg-white border-top d-flex justify-content-between">
    <span className="text-muted small">
      {proofUrl && proofUrl.length > 0 &&
        `Image ${currentIndex + 1} of ${
          Array.isArray(proofUrl)
            ? proofUrl.length
            : typeof proofUrl === "string" && proofUrl.startsWith("[")
            ? JSON.parse(proofUrl).length
            : 1
        }`}
    </span>
    <Button
      variant="secondary"
      className="close-btn px-4 py-2 rounded-3 fw-semibold fs-6"
      onClick={() => setShowProofViewModal(false)}
    >
      Close
    </Button>
  </Modal.Footer>
</Modal>
    </AdminLayout>
  );
};

export default ViewOrder;
