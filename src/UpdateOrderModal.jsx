import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col, Collapse } from "react-bootstrap";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import axios from "axios";
import { FaRegTrashAlt, FaPlusCircle } from "react-icons/fa";
import Swal from "sweetalert2";
import { ToastHelper } from "./helpers/ToastHelper";
import { HiQuestionMarkCircle } from "react-icons/hi";

const paymentOptions = [
  { label: "Cash", value: "Cash" },
  { label: "Bank Transfer", value: "Bank Transfer" },
];

const UpdateOrderModal = ({
  show,
  handleClose,
  handleSubmit,
  formData,
  setFormData,
  editableItems,
  setEditableItems,
}) => {
  const total = editableItems.reduce(
    (sum, item) => sum + item.quantity * item.unit_cost,
    0
  );

  const [productOptions, setProductOptions] = useState([]);
  const [itemOptions, setItemOptions] = useState({});
  const [showPaymentUpdate, setShowPaymentUpdate] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [activeFAQIndex, setActiveFAQIndex] = useState(null);

  const guideqst = [
    {
      question: "How can I save the changes i made?",
      answer:
        "Click the 'Save Changes' button below the transaction details.Then confirm your chanages",
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
  ];

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const productsRes = await axios.get(
          "http://localhost/DeliveryTrackingSystem/get_products.php"
        );

        const uniqueProducts = Array.from(
          new Map(productsRes.data.map((item) => [item.value, item])).values()
        );

        setProductOptions(uniqueProducts);

        const itemsRes = await axios.get(
          "http://localhost/DeliveryTrackingSystem/get_items.php"
        );
        setItemOptions(itemsRes.data);
      } catch (err) {
        console.error("Error fetching options", err);
      }
    };

    fetchOptions();
  }, []);

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === "") return "";
    const num = parseFloat(value.toString().replace(/[^0-9.]/g, ""));
    if (isNaN(num)) return "";
    return (
      "₱" +
      num.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  const parseCurrency = (value) => {
    if (!value) return 0;
    return parseFloat(value.toString().replace(/[₱,]/g, "")) || 0;
  };

  const handleProductChange = (index, selected) => {
    const newItems = [...editableItems];
    newItems[index].type_of_product = selected?.value || "";
    newItems[index].description = "";
    setEditableItems(newItems);
  };

  const handleItemChange = (index, selected) => {
    const newItems = [...editableItems];
    newItems[index].description = selected?.value || "";
    setEditableItems(newItems);
  };

  const handleDownPaymentChange = (e) => {
    const down_payment = parseFloat(e.target.value) || 0;
    const balance =
      total - down_payment - (parseFloat(formData.full_payment) || 0);
    setFormData({
      ...formData,
      down_payment,
      balance: balance.toFixed(2),
      total: total.toFixed(2),
    });
  };

  const selectedPaymentOption = (() => {
    for (const option of paymentOptions) {
      if (option.options) {
        const found = option.options.find(
          (sub) => sub.value === formData.mode_of_payment
        );
        if (found) return found;
      } else if (option.value === formData.mode_of_payment) {
        return option;
      }
    }
    return null;
  })();

  const handleAddItem = () => {
    setEditableItems([
      ...editableItems,
      { quantity: 1, type_of_product: "", description: "", unit_cost: 0 },
    ]);
  };

  const handleSaveChanges = () => {
    if (editableItems.length === 0) {
      ToastHelper.error("Items ordered cannot be empty.");
      return;
    }

    for (let i = 0; i < editableItems.length; i++) {
      const item = editableItems[i];
      if (!item.type_of_product) {
        ToastHelper.error(`Item ${i + 1}: Type of product cannot be empty.`);
        return;
      }
      if (!item.description) {
        ToastHelper.error(`Item ${i + 1}: Item name cannot be empty.`);
        return;
      }
      if (!item.quantity || item.quantity <= 0) {
        ToastHelper.error(`Item ${i + 1}: Quantity must be greater than 0.`);
        return;
      }
      if (!item.unit_cost || item.unit_cost <= 0) {
        ToastHelper.error(`Item ${i + 1}: Unit cost must be greater than 0.`);
        return;
      }
    }
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to update this order?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, update it!",
    }).then((result) => {
      if (result.isConfirmed) {
        const cleanFormData = {
          ...formData,
          down_payment: parseFloat(formData.down_payment) || 0,
          full_payment: parseFloat(formData.full_payment) || 0,
          balance: parseFloat(formData.balance) || 0,
          total: parseFloat(formData.total) || 0,
        };

        setFormData(cleanFormData);
        handleSubmit();
      }
    });
  };

  const remainingBalance =
    total -
    (parseFloat(formData.down_payment) || 0) -
    (parseFloat(formData.full_payment) || 0);

  return (
    <>
      {showFAQ && (
        <Modal
          show={showFAQ}
          onHide={() => setShowFAQ(false)}
          centered
          backdrop="true"
          keyboard={false}
        >
          <Modal.Header closeButton>
            <Modal.Title>Guide for Updating Delivery Details</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <p className="px-3 text-justify">
              The Update Delivery Details page allows you to modify existing
              transaction information such as customer details, ordered items,
              or payment records. Use the update buttons provided to make
              necessary changes, and confirm your updates to ensure that the
              delivery information remains accurate and up to date.
            </p>

            <div className="px-3 mb-3">
              {guideqst.map((faq, index) => (
                <div key={index} className="mb-2">
                  <button
                    className={`faq-btn w-100 text-start ${
                      activeFAQIndex === index ? "active" : ""
                    }`}
                    onClick={() =>
                      setActiveFAQIndex(activeFAQIndex === index ? null : index)
                    }
                  >
                    {faq.question}
                  </button>
                  <Collapse in={activeFAQIndex === index}>
                    <div className="faq-answer">
                      <strong>Answer:</strong>
                      <p className="mt-2 mb-0">{faq.answer}</p>
                    </div>
                  </Collapse>
                </div>
              ))}
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="outline-secondary"
              onClick={() => {
                setShowFAQ(false);
                setActiveFAQIndex(null);
              }}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      <Modal show={show} onHide={handleClose} size="lg" centered>
        <Modal.Header
          closeButton
          closeVariant="white"
          style={{ backgroundColor: "#008f4c" }}
        >
          <Modal.Title className="text-white">Update Delivery Info</Modal.Title>
          <HiQuestionMarkCircle
            style={{
              fontSize: "2rem",
              color: "#d7e0d798",
              cursor: "pointer",
              marginLeft: "10px",
            }}
            onClick={() => setShowFAQ(true)}
          />
        </Modal.Header>

        <Modal.Body className="bg-light">
          <Form>
            <Row className="p-3 bg-white rounded shadow-sm border mb-4">
              <Col md={6}>
                <h5 className="text-success fw-bold mb-3">
                  Customer Information
                </h5>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customer_name: e.target.value,
                      })
                    }
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    type="text"
                    name="customer_address"
                    value={formData.customer_address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customer_address: e.target.value,
                      })
                    }
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Contact</Form.Label>
                  <Form.Control
                    type="text"
                    name="customer_contact"
                    maxLength="11"
                    value={formData.customer_contact}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d{0,11}$/.test(value)) {
                        setFormData({ ...formData, customer_contact: value });
                      }
                    }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Target Delivery Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="target_date_delivery"
                    value={
                      formData.target_date_delivery
                        ? new Date(formData.target_date_delivery)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        target_date_delivery: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <h5 className="text-success fw-bold mb-3">Payment Details</h5>

                <Form.Group className="mb-3">
                  <Form.Label>Payment Method</Form.Label>
                  <Select
                    options={paymentOptions}
                    value={selectedPaymentOption}
                    onChange={(selected) =>
                      setFormData({
                        ...formData,
                        mode_of_payment: selected.value,
                      })
                    }
                    placeholder="Select Payment Method"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Payment Option</Form.Label>
                  <Form.Select
                    name="payment_option"
                    value={formData.payment_option}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payment_option: e.target.value,
                      })
                    }
                  >
                    <option value="Full Payment">Full Payment</option>
                    <option value="Down Payment">Down Payment</option>
                  </Form.Select>
                </Form.Group>

                {formData.payment_option === "Down Payment" && (
                  <Form.Group className="mb-3">
                    <Form.Label>Down Payment</Form.Label>
                    <Form.Control
                      type="text"
                      value={
                        formData.isEditingDown
                          ? formData.down_payment
                          : formatCurrency(formData.down_payment)
                      }
                      onFocus={() =>
                        setFormData({ ...formData, isEditingDown: true })
                      }
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(
                          /[^0-9.]/g,
                          ""
                        );
                        const balance =
                          total -
                          numericValue -
                          (parseFloat(formData.full_payment) || 0);
                        setFormData({
                          ...formData,
                          down_payment: numericValue,
                          balance: balance.toFixed(2),
                        });
                      }}
                      onBlur={() => {
                        setFormData({
                          ...formData,
                          isEditingDown: false,
                          down_payment: parseFloat(formData.down_payment) || 0,
                        });
                      }}
                    />
                  </Form.Group>
                )}

                {formData.payment_option === "Down Payment" && (
                  <Form.Group className="mb-3">
                    <Form.Label>Remaining Balance</Form.Label>
                    <Form.Control
                      type="text"
                      value={`₱${remainingBalance.toLocaleString()}`}
                      readOnly
                      disabled
                      className="bg-secondary text-dark fw-semibold border-0 bg-opacity-25"
                      style={{
                        cursor: "not-allowed",
                        opacity: 0.9,
                      }}
                    />
                  </Form.Group>
                )}

                {formData.payment_option === "Down Payment" && (
                  <div className="mb-3">
                    <Button
                      variant="success"
                      onClick={() => setShowPaymentUpdate(!showPaymentUpdate)}
                    >
                      {showPaymentUpdate
                        ? "Hide Payment Update"
                        : "Update Payment"}
                    </Button>
                  </div>
                )}

                {showPaymentUpdate && (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Label>Final Payment (Balance Paid)</Form.Label>
                      <Form.Control
                        type="text"
                        value={
                          formData.isEditingFull
                            ? formData.full_payment
                            : formatCurrency(formData.full_payment)
                        }
                        onFocus={() =>
                          setFormData({ ...formData, isEditingFull: true })
                        }
                        onChange={(e) => {
                          const numericValue = e.target.value.replace(
                            /[^0-9.]/g,
                            ""
                          );
                          const balance =
                            total -
                            (parseFloat(formData.down_payment) || 0) -
                            (parseFloat(numericValue) || 0);
                          setFormData({
                            ...formData,
                            full_payment: numericValue,
                            balance: balance.toFixed(2),
                          });
                        }}
                        onBlur={() => {
                          setFormData({
                            ...formData,
                            isEditingFull: false,
                            full_payment:
                              parseFloat(formData.full_payment) || 0,
                          });
                        }}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Date of Final Payment</Form.Label>
                      <Form.Control
                        type="date"
                        value={formData.fbilling_date || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fbilling_date: e.target.value,
                          })
                        }
                      />
                    </Form.Group>
                  </>
                )}
              </Col>
            </Row>

            <div className="p-3 bg-white rounded shadow-sm border">
              <h5 className="text-success fw-bold mb-3 d-flex justify-content-between align-items-center">
                Items Ordered
                <FaPlusCircle
                  style={{ cursor: "pointer", color: "rgba(23, 133, 80, 1)" }}
                  onClick={handleAddItem}
                  title="Add new item"
                />
              </h5>

              <table className="table table-bordered table-striped align-middle">
                <thead
                  className="table-success text-center"
                  style={{ backgroundColor: "##d3eed3" }}
                >
                  <tr>
                    <th style={{ width: "10%" }}>Quantity</th>
                    <th style={{ width: "25%" }}>Type of Product</th>
                    <th style={{ width: "25%" }}>Item Name</th>
                    <th style={{ width: "20%" }}>Unit Cost</th>
                    <th style={{ width: "10%" }}>Action</th>
                  </tr>
                </thead>

                <tbody className="text-center table-white">
                  {editableItems.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <Form.Control
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => {
                            const newItems = [...editableItems];
                            newItems[index].quantity =
                              parseInt(e.target.value) || 1;
                            setEditableItems(newItems);
                          }}
                        />
                      </td>

                      <td>
                        <Select
                          options={productOptions}
                          value={
                            productOptions.find(
                              (opt) => opt.value === item.type_of_product
                            ) || null
                          }
                          onChange={(selected) =>
                            handleProductChange(index, selected)
                          }
                          placeholder="Select type"
                          isSearchable
                        />
                      </td>

                      <td>
                        <Select
                          options={itemOptions[item.type_of_product] || []}
                          value={
                            (itemOptions[item.type_of_product] || []).find(
                              (opt) => opt.value === item.description
                            ) || null
                          }
                          onChange={(selected) =>
                            handleItemChange(index, selected)
                          }
                          placeholder="Select item"
                          isSearchable
                        />
                      </td>

                      <td>
                        <Form.Control
                          type="text"
                          value={
                            item.isEditing
                              ? item.unit_cost
                              : formatCurrency(item.unit_cost)
                          }
                          onFocus={() => {
                            const newItems = [...editableItems];
                            newItems[index].isEditing = true;
                            setEditableItems(newItems);
                          }}
                          onChange={(e) => {
                            const numericValue = e.target.value.replace(
                              /[^0-9.]/g,
                              ""
                            );
                            const newItems = [...editableItems];
                            newItems[index].unit_cost = numericValue;
                            setEditableItems(newItems);
                          }}
                          onBlur={() => {
                            const newItems = [...editableItems];
                            newItems[index].isEditing = false;
                            newItems[index].unit_cost =
                              parseFloat(newItems[index].unit_cost) || 0;
                            setEditableItems(newItems);
                          }}
                        />
                      </td>

                      <td>
                        <FaRegTrashAlt
                          style={{
                            color: "#dc3545",
                            cursor: "pointer",
                            fontSize: "18px",
                          }}
                          title="Remove this item"
                          onClick={() => {
                            Swal.fire({
                              title: "Remove this item?",
                              text: "This action cannot be undone.",
                              icon: "warning",
                              showCancelButton: true,
                              confirmButtonColor: "#dc3545",
                              cancelButtonColor: "#6c757d",
                              confirmButtonText: "Yes, remove it!",
                            }).then((result) => {
                              if (result.isConfirmed) {
                                const newItems = editableItems.filter(
                                  (_, i) => i !== index
                                );
                                setEditableItems(newItems);
                              }
                            });
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="text-end mt-3">
                <h5 className="fw-bold text-success">
                  Total Cost: ₱{total.toLocaleString()}
                </h5>
              </div>
            </div>
          </Form>
        </Modal.Body>

        <Modal.Footer className="bg-white">
          <Button
            className="cancel-btn btn btn- d-flex align-items-center gap-2 fs-6 rounded-2 px-3 py-1"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            className="upd-btn btn-success d-flex align-items-center gap-2 fs-6 rounded-2 px-3 py-1"
            style={{ fontSize: "16px" }}
            onClick={handleSaveChanges}
          >
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default UpdateOrderModal;
