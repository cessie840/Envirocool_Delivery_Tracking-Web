import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import AdminLayout from "./AdminLayout";
import UpdateOrderModal from "./UpdateOrderModal";
import RescheduleModal from "./RescheduleModal";
import { Button, Modal, Collapse, Form } from "react-bootstrap";
import { Toaster, toast } from "sonner";
import { ToastHelper } from "./helpers/ToastHelper";
import { HiQuestionMarkCircle } from "react-icons/hi";

const ViewOrder = () => {
  const navigate = useNavigate();
  const { transaction_id } = useParams();
  const [orderDetails, setOrderDetails] = useState(null);
  const [editableItems, setEditableItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [formData, setFormData] = useState({
    tracking_number: "",
    customer_name: "",
    customer_address: "",
    customer_contact: "",
    date_of_order: "",
    target_date_delivery: "",
    mode_of_payment: "",
    payment_option: "",
    down_payment: "",
    balance: "",
    total: "",
    proof_of_delivery: "",
    full_payment: "0",
    fbilling_date: "",
  });

  const [showFAQ, setShowFAQ] = useState(false);
  const [activeFAQIndex, setActiveFAQIndex] = useState(null);

  const guideqst = [
    {
      question: "How can I update a delivery transaction?",
      answer:
        "Click the 'Update' button below the transaction details. A modal will appear where you can modify customer information, order details, or payment information.",
    },
    {
      question:
        "Where can I add another payment record for the remaining balance?",
      answer:
        "Click the 'Update Payment' button to enter the final payment made by the customer.",
    },
    {
      question: "How can I add new ordered items to a transaction?",
      answer:
        "Click the add (+) icon in the 'Items Ordered' section to include additional items for the customer’s order.",
    },
    {
      question: "How can I reschedule a delivery?",
      answer:
        "The 'Reschedule' button will appear if the order has been cancelled. Click it to select a new delivery date, then confirm your changes.",
    },
  ];

  const [showProofViewModal, setShowProofViewModal] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [modalTitle, setModalTitle] = useState("");

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
        setOrderDetails(data);
        setFormData({
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
          proof_of_delivery: data.proof_of_delivery,
          full_payment: data.full_payment || "0",
          fbilling_date: data.fbilling_date || "",
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
    const fixedItems = orderDetails.items.map((item) => ({
      quantity: item.quantity,
      type_of_product: item.type_of_product || item.product_type || "",
      description: item.description || item.item_name || "",
      unit_cost: item.unit_cost,
    }));
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
    <AdminLayout
      title={
        <div className="d-flex align-items-center gap-2">
          <span>View Order Details</span>
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
      showSearch={false}
    >
      <div className="d-flex justify-content-start mt-4 ms-4">
        <button
          className="back-btn btn-success d-flex align-items-center gap-2 rounded-2"
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
                    <span>Rescheduled Delivery Date: </span>
                    {orderDetails.rescheduled_date
                      ? formatDate(orderDetails.rescheduled_date)
                      : "—"}
                  </p>
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
                      {orderDetails.down_payment &&
                        parseFloat(orderDetails.down_payment) > 0 && (
                          <p>
                            <span>Initial Payment (Down Payment):</span> ₱
                            {Number(orderDetails.down_payment).toLocaleString()}
                          </p>
                        )}

                      {orderDetails.full_payment &&
                        parseFloat(orderDetails.full_payment) > 0 && (
                          <>
                            <p>
                              <span>Final Payment (Balance Paid):</span> ₱
                              {Number(
                                orderDetails.full_payment
                              ).toLocaleString()}
                            </p>

                            {calculatedBalance > 0 && (
                              <p>
                                <span>Remaining Balance:</span> ₱
                                {calculatedBalance.toLocaleString()}
                              </p>
                            )}

                            {orderDetails.fbilling_date &&
                              orderDetails.fbilling_date !== "0000-00-00" && (
                                <p>
                                  <span>Date of Final Payment:</span>{" "}
                                  {formatDate(orderDetails.fbilling_date)}
                                </p>
                              )}
                          </>
                        )}

                      {orderDetails.payment_option === "Down Payment" &&
                        (!orderDetails.full_payment ||
                          parseFloat(orderDetails.full_payment) === 0) && (
                          <p>
                            <span>Remaining Balance:</span> ₱
                            {calculatedBalance.toLocaleString()}
                          </p>
                        )}
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
              ) && (
                <button
                  className="btn upd-btn btn-success px-5 py-2 rounded-2"
                  onClick={handleUpdate}
                >
                  Update
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

      <UpdateOrderModal
        show={showModal}
        handleClose={handleClose}
        handleSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        editableItems={editableItems}
        setEditableItems={setEditableItems}
      />

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
      >
        <Modal.Header
          closeButton
          className="bg-primary bg-opacity-75 text-white"
        >
          <Modal.Title>{modalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex justify-content-center bg-light">
          {Array.isArray(proofUrl) ||
          (typeof proofUrl === "string" && proofUrl.startsWith("[")) ? (
            <div className="d-flex align-items-center justify-content-center">
              {proofUrl.length > 1 && (
                <button
                  className="btn btn-secondary me-2"
                  onClick={() => {
                    const container = document.getElementById(
                      "proof-scroll-container"
                    );
                    const imageWidth = container.clientWidth;
                    container.scrollBy({
                      left: -imageWidth,
                      behavior: "smooth",
                    });
                  }}
                >
                  ‹
                </button>
              )}
              <div
                id="proof-scroll-container"
                style={{
                  display: "flex",
                  overflowX: "auto",
                  scrollBehavior: "smooth",
                  width: "700px",
                  height: "720px",
                  gap: "10px",
                  padding: "5px",
                  border: "2px solid #ccc",
                  borderRadius: "10px",
                }}
              >
                {proofUrl.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`${modalTitle} ${index + 1}`}
                    style={{
                      width: "700px",
                      height: "680px",
                      objectFit: "contain",
                      flexShrink: 0,
                      scrollSnapAlign: "center",
                    }}
                  />
                ))}
              </div>
              {proofUrl.length > 1 && (
                <button
                  className="btn btn-secondary ms-2"
                  onClick={() => {
                    const container = document.getElementById(
                      "proof-scroll-container"
                    );
                    const imageWidth = container.clientWidth;
                    container.scrollBy({
                      left: imageWidth,
                      behavior: "smooth",
                    });
                  }}
                >
                  ›
                </button>
              )}
            </div>
          ) : proofUrl ? (
            <img
              src={proofUrl}
              alt={modalTitle}
              className="w-100 h-auto"
              style={{
                maxHeight: "75vh",
                maxWidth: "35rem",
                objectFit: "fill",
                border: "1px solid #9E9E9EFF",
              }}
            />
          ) : (
            <p className="text-muted">
              No {modalTitle.toLowerCase()} available.
            </p>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowProofViewModal(false)}
            className="close-btn px-3 py-2 rounded-2 fs-6"
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showFAQ}
        onHide={() => setShowFAQ(false)}
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
          <Modal.Title>Guide for View Order Details</Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ backgroundColor: "#f8f9fa" }}>
          <p className="px-3 text-justify mb-4" style={{ color: "#333" }}>
            The View Order Details page allows you to review all information
            related to a specific order, including customer details, ordered
            items, and payment records. From here, you can update pending
            transactions, add new items, or record additional payments. Once the
            order is marked as
            <span className="fw-bold text-success"> Delivered</span>,{" "}
            <span className="fw-bold text-danger">Cancelled</span>, or{" "}
            <span className="fw-bold text-primary">Out for Delivery</span>,
            editing options will be limited to preserve data accuracy.
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
                      onMouseOver={(e) => {
                        if (activeFAQIndex !== index) {
                          e.currentTarget.style.backgroundColor = "#d9eff1";
                        }
                      }}
                      onMouseOut={(e) => {
                        if (activeFAQIndex !== index) {
                          e.currentTarget.style.backgroundColor = "#e9f6f8";
                        }
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
            variant="outline-secondary"
            onClick={() => setShowFAQ(false)}
            className="px-4"
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </AdminLayout>
  );
};

export default ViewOrder;
