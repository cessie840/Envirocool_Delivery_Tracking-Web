import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Form, Button, Modal } from "react-bootstrap";
import AdminLayout from "./AdminLayout";
import UpdateOrderModal from "./UpdateOrderModal";
import { ToastHelper } from "./helpers/ToastHelper";
import { HiQuestionMarkCircle } from "react-icons/hi";
import { FaFilter } from "react-icons/fa";

const DeliveryDetails = () => {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [filter, setFiltered] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editableItems, setEditableItems] = useState([]);
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

  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [showFAQ, setShowFAQ] = useState(false);
  const [activeFAQIndex, setActiveFAQIndex] = useState(null);

  // QBE state: multiple fields in one modal
  const [showQbeModal, setShowQbeModal] = useState(false);
  const [qbeName, setQbeName] = useState("");
  const [qbeAddress, setQbeAddress] = useState("");
  const [qbePaymentMethod, setQbePaymentMethod] = useState("");
  const [qbePaymentOption, setQbePaymentOption] = useState("");
  const [qbeItems, setQbeItems] = useState("");
  const [qbeTotal, setQbeTotal] = useState("");

  const guideqst = [
    {
      question: "How can I add a new delivery?",
      answer:
        "Click the 'Add Delivery' button at the top right, or navigate to the Add Delivery page to input the transaction details.",
    },
    {
      question:
        "How can I view only the transactions that are out for delivery?",
      answer:
        "Use the 'Filter by Status' dropdown above the table and select 'Out for Delivery' to display only those transactions.",
    },
    {
      question: "How can I find a specific transaction?",
      answer:
        "Use the search bar to look for a specific record by typing the customer's name, tracking number, or transaction number.",
    },
    {
      question: "Where can I view the full details of a transaction?",
      answer:
        "Click the 'View' button on the corresponding transaction row to see all details.",
    },
    {
      question: "Why is the 'Update Payment' button disabled for some records?",
      answer:
        "The 'Update Payment' button is only enabled for transactions with an existing balance. It becomes disabled once the balance has already been cleared.",
    },
  ];

  const handleClose = () => setShowModal(false);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  const fetchDeliveries = () => {
    fetch("http://localhost/DeliveryTrackingSystem/get_deliveries.php")
      .then((res) => res.json())
      .then((data) => {
        setDeliveries(data || []);
        setFiltered(data || []);
      })
      .catch((err) => console.error("Failed to fetch deliveries:", err));
  };

  useEffect(() => {
    document.title = "Admin Delivery Details";
    fetchDeliveries();
  }, []);

  const refetchData = () => fetchDeliveries();

  const handleAddDelivery = () => navigate("/add-delivery");

  const handleUpdate = (id) => {
    fetch(
      `http://localhost/DeliveryTrackingSystem/view_deliveries.php?transaction_id=${id}&_=${Date.now()}`,
      {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (!data || data.error) {
          ToastHelper.error("Failed to fetch delivery details.");
          return;
        }

        const parsedPayments = Array.isArray(data.payments)
          ? data.payments
          : (() => {
              try {
                return JSON.parse(data.payments || "[]");
              } catch {
                return [];
              }
            })();

        setFormData({
          transaction_id: data.transaction_id,
          tracking_number: data.tracking_number,
          customer_name: data.customer_name,
          customer_address: data.customer_address,
          customer_contact: data.customer_contact,
          date_of_order: formatDate(data.date_of_order),
          mode_of_payment: data.mode_of_payment,
          payment_option: data.payment_option,
          down_payment: data.down_payment,
          full_payment: data.full_payment,
          fbilling_date: data.fbilling_date,
          balance: data.balance,
          total: data.total,
          target_date_delivery: formatDate(data.target_date_delivery),
          dbilling_date: formatDate(data.dbilling_date),
          payments: parsedPayments,
        });

        const fixedItems = (data.items || []).map((item) => ({
          quantity: item.quantity,
          type_of_product: item.type_of_product || "",
          description: item.description || "",
          unit_cost: parseFloat(item.unit_cost) || 0,
        }));

        setEditableItems(fixedItems);
        setShowModal(true);
      })
      .catch((err) => {
        console.error("Error fetching order:", err);
        ToastHelper.error("Something went wrong while fetching the delivery.");
      });
  };

  const applyFilters = (list, term, status) => {
    const lower = String(term || "")
      .toLowerCase()
      .trim();
    return list.filter((e) => {
      const matchesSearch =
        (e.transaction_id &&
          String(e.transaction_id).toLowerCase().includes(lower)) ||
        (e.tracking_number &&
          String(e.tracking_number).toLowerCase().includes(lower)) ||
        (e.customer_name &&
          String(e.customer_name).toLowerCase().includes(lower)) ||
        (e.delivery_status &&
          String(e.delivery_status).toLowerCase().includes(lower)) ||
        (e.description && String(e.description).toLowerCase().includes(lower));

      const matchesStatus = status === "All" || e.delivery_status === status;
      return matchesSearch && matchesStatus;
    });
  };

  // New QBE filter: accepts multiple fields and applies them as AND conditions
  const applyQBEFilter = (list, qbeFields, status) => {
    const {
      name = "",
      address = "",
      paymentMethod = "",
      paymentOption = "",
      items = "",
      total = "",
    } = qbeFields || {};

    const nameLower = String(name || "")
      .toLowerCase()
      .trim();
    const addressLower = String(address || "")
      .toLowerCase()
      .trim();
    const paymentMethodLower = String(paymentMethod || "")
      .toLowerCase()
      .trim();
    const paymentOptionLower = String(paymentOption || "")
      .toLowerCase()
      .trim();
    const itemsLower = String(items || "")
      .toLowerCase()
      .trim();
    const totalLower = String(total || "")
      .toLowerCase()
      .trim();

    return list.filter((e) => {
      if (status !== "All" && e.delivery_status !== status) return false;

      // build haystack for flexible searching
      const parts = [];
      if (e.transaction_id) parts.push(String(e.transaction_id));
      if (e.tracking_number) parts.push(String(e.tracking_number));
      if (e.customer_name) parts.push(String(e.customer_name));
      if (e.customer_address) parts.push(String(e.customer_address));
      if (e.mode_of_payment) parts.push(String(e.mode_of_payment));
      if (e.payment_option) parts.push(String(e.payment_option));
      if (e.description) parts.push(String(e.description));
      if (e.total) parts.push(String(e.total));

      if (e.items) {
        try {
          if (Array.isArray(e.items)) {
            parts.push(
              e.items
                .map(
                  (it) =>
                    `${it.description || ""} ${it.quantity || ""} ${
                      it.type_of_product || ""
                    }`
                )
                .join(" ")
            );
          } else {
            parts.push(String(e.items));
          }
        } catch {
          parts.push(String(e.items));
        }
      }

      const hay = parts.join(" ").toLowerCase();

      // For each provided field, require a match (AND logic). If the field is blank, treat as pass.
      if (
        nameLower &&
        !(
          e.customer_name &&
          String(e.customer_name).toLowerCase().includes(nameLower)
        )
      )
        return false;
      if (
        addressLower &&
        !(
          e.customer_address &&
          String(e.customer_address).toLowerCase().includes(addressLower)
        )
      )
        return false;
      if (
        paymentMethodLower &&
        !(
          e.mode_of_payment &&
          String(e.mode_of_payment).toLowerCase().includes(paymentMethodLower)
        )
      )
        return false;
      if (
        paymentOptionLower &&
        !(
          e.payment_option &&
          String(e.payment_option).toLowerCase().includes(paymentOptionLower)
        )
      )
        return false;
      if (itemsLower && !hay.includes(itemsLower)) return false;

      if (totalLower) {
        // allow number-ish comparisons or substring
        const normTotal = String(e.total || "")
          .replace(/,/g, "")
          .toLowerCase();
        if (normTotal.includes(totalLower.replace(/,/g, ""))) {
          // ok
        } else if (!hay.includes(totalLower)) {
          return false;
        }
      }

      return true;
    });
  };

  const handleSearch = (term) => {
    setFiltered(applyFilters(deliveries, term, statusFilter));
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    // re-apply current QBE if any, otherwise simple status filter
    const hasQBE =
      qbeName ||
      qbeAddress ||
      qbePaymentMethod ||
      qbePaymentOption ||
      qbeItems ||
      qbeTotal;
    if (hasQBE) {
      const qbeFields = {
        name: qbeName,
        address: qbeAddress,
        paymentMethod: qbePaymentMethod,
        paymentOption: qbePaymentOption,
        items: qbeItems,
        total: qbeTotal,
      };
      setFiltered(applyQBEFilter(deliveries, qbeFields, status));
    } else {
      setFiltered(applyFilters(deliveries, "", status));
    }
  };

  const openQbeModal = () => {
    setShowQbeModal(true);
    // keep existing values so user can edit previous query
  };

  const handleQBEApply = () => {
    const qbeFields = {
      name: qbeName,
      address: qbeAddress,
      paymentMethod: qbePaymentMethod,
      paymentOption: qbePaymentOption,
      items: qbeItems,
      total: qbeTotal,
    };

    const filtered = applyQBEFilter(deliveries, qbeFields, statusFilter);
    setFiltered(filtered);
    setShowQbeModal(false);
  };

  const clearQBE = () => {
    setQbeName("");
    setQbeAddress("");
    setQbePaymentMethod("");
    setQbePaymentOption("");
    setQbeItems("");
    setQbeTotal("");
    setFiltered(applyFilters(deliveries, "", statusFilter));
  };

  const groupedDeliveries = filter.reduce((acc, item) => {
    const id = item.transaction_id;
    if (!acc[id]) {
      acc[id] = {
        transaction_id: id,
        customer_name: item.customer_name,
        tracking_number: item.tracking_number,
        total: item.total,
        balance: parseFloat(String(item.balance || "0").replace(/,/g, "")) || 0,
        delivery_status: item.delivery_status,
        items: [],
      };
    }
    acc[id].items.push({
      description: item.description,
      quantity: item.quantity,
    });
    return acc;
  }, {});

  const allDeliveries = Object.values(groupedDeliveries).sort(
    (a, b) => b.transaction_id - a.transaction_id
  );

  const totalPages = Math.ceil(allDeliveries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDeliveries = allDeliveries.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <AdminLayout
      title={
        <div className="d-flex align-items-center gap-2">
          <span>Delivery Details</span>
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
      onAddClick={handleAddDelivery}
      showSearch={true}
      onSearch={handleSearch}
    >
      <div className="mb-3 d-flex justify-content-end align-items-center">
        {/* Single QBE Button (left of the status filter) */}
        <div className="me-2">
          <button
            className="btn d-flex align-items-center"
            title="Advanced Filter (QBE)"
            onClick={openQbeModal}
            style={{
              backgroundColor: "#116B8A",
              color: "white",
              border: "none",
              padding: "8px 12px",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <FaFilter />
            Advanced Filter
          </button>
        </div>

        <Form.Select
          value={statusFilter}
          onChange={(e) => handleStatusFilter(e.target.value)}
          style={{
            width: "250px",
            border: "1px solid #CADBC8FF ",
            fontWeight: "500",
          }}
        >
          <option value="All">Filter by Delivery Status</option>
          <option value="Pending">Pending</option>
          <option value="Out for Delivery">Out for Delivery</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </Form.Select>
      </div>

      <Table
        bordered
        hover
        responsive
        className="delivery-table container-fluid table-responsive bg-white"
      >
        <thead>
          <tr>
            <th>Transaction No.</th>
            <th>Tracking No.</th>
            <th>Client Name</th>
            <th>Delivery Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedDeliveries.length > 0 ? (
            paginatedDeliveries.map((group, index) => {
              const numericBalance =
                parseFloat(String(group.balance || "0").replace(/,/g, "")) || 0;

              return (
                <tr key={index} className="delivery-table-hover">
                  <td>{group.transaction_id}</td>
                  <td>{group.tracking_number}</td>
                  <td>{group.customer_name}</td>
                  <td>
                    <span
                      style={{
                        backgroundColor:
                          group.delivery_status === "Delivered"
                            ? "#C6FCD3"
                            : group.delivery_status === "Cancelled"
                            ? "#FDE0E0"
                            : group.delivery_status === "Pending"
                            ? "#FFF5D7"
                            : group.delivery_status === "Out for Delivery"
                            ? "#d2e6f5ff"
                            : "transparent",
                        color:
                          group.delivery_status === "Delivered"
                            ? "#3E5F44"
                            : group.delivery_status === "Cancelled"
                            ? "red"
                            : group.delivery_status === "Pending"
                            ? "#FF9D23"
                            : group.delivery_status === "Out for Delivery"
                            ? "#1762b1ff"
                            : "black",
                        padding: "5px",
                        borderRadius: "8px",
                        display: "inline-block",
                        minWidth: "80px",
                        textAlign: "center",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                      }}
                    >
                      {group.delivery_status}
                    </span>
                  </td>

                  <td className="align-middle text-center">
                    <div className="action-btn d-flex justify-content-center gap-2 py-2">
                      <button
                        className="btn btn-view"
                        onClick={() =>
                          navigate(`/view-delivery/${group.transaction_id}`)
                        }
                      >
                        View
                      </button>

                      <button
                        className="btn upd-btn"
                        onClick={() => handleUpdate(group.transaction_id)}
                        disabled={
                          group.delivery_status === "Out for Delivery" ||
                          group.delivery_status === "Cancelled" ||
                          (group.delivery_status === "Delivered" &&
                            group.payment_option === "Full Payment") ||
                          numericBalance <= 0
                        }
                        style={
                          numericBalance <= 0
                            ? { opacity: 0.5, cursor: "not-allowed" }
                            : {}
                        }
                      >
                        Update Payment
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="7" className="text-center py-4">
                No deliveries found.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      <div className="custom-pagination d-flex justify-content-center align-items-center mt-3">
        <button
          className="page-btn btn btn-white mx-1"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          ‹
        </button>
        <span className="page-info mx-2">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="page-btn btn btn-white mx-1"
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          ›
        </button>
      </div>

      <UpdateOrderModal
        show={showModal}
        handleClose={handleClose}
        onSuccess={refetchData}
        formData={formData}
        setFormData={setFormData}
        editableItems={editableItems}
        setEditableItems={setEditableItems}
      />

      {/* Single QBE Modal */}
      <Modal show={showQbeModal} onHide={() => setShowQbeModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Advanced Filter (QBE)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Customer name"
              value={qbeName}
              onChange={(e) => setQbeName(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Address</Form.Label>
            <Form.Control
              type="text"
              placeholder="Customer address"
              value={qbeAddress}
              onChange={(e) => setQbeAddress(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Payment Method</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. Cash, Bank Transfer"
              value={qbePaymentMethod}
              onChange={(e) => setQbePaymentMethod(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Items Ordered</Form.Label>
            <Form.Control
              type="text"
              placeholder="Item description or type"
              value={qbeItems}
              onChange={(e) => setQbeItems(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Total Cost</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. 1000 or 1,000"
              value={qbeTotal}
              onChange={(e) => setQbeTotal(e.target.value)}
            />
            <Form.Text className="text-muted">
              Leave fields blank to ignore them in the query.
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

      {/* FAQ Modal */}
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
          <Modal.Title>Guide for Delivery Details</Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ backgroundColor: "#f8f9fa" }}>
          <p className="px-3 text-justify mb-4" style={{ color: "#333" }}>
            The Delivery Details page provides a comprehensive overview of a
            specific transaction, including transaction number, tracking number,
            client name, and delivery status. You can view the full details of
            each delivery by clicking the "View" button. <br />
            <br />
            To update the payment for a transaction, click the "Update Payment"
            button. Transactions can only be updated if the{" "}
            <span className="fw-bold text-success">payment option</span> is set
            to <span className="fw-bold text-success">Down Payment</span>,
            allowing you to record additional payments made by the customer.
            Once the balance is fully paid, the transaction becomes read-only to
            ensure data integrity.
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
            onClick={() => {
              setShowFAQ(false);
              setActiveFAQIndex(null);
            }}
            className="close-btn py-2 px-4 fs-6 rounded-2"
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </AdminLayout>
  );
};

export default DeliveryDetails;
