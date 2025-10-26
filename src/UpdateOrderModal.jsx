import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import axios from "axios";
import { FaRegTrashAlt, FaPlusCircle } from "react-icons/fa";
import Swal from "sweetalert2";

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

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const productsRes = await axios.get(
          "http://localhost/DeliveryTrackingSystem/get_products.php"
        );
        setProductOptions(productsRes.data);

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

  useEffect(() => {
    if (editableItems.length > 0) {
      setProductOptions((prev) => {
        const updated = [...prev];
        editableItems.forEach((item) => {
          if (
            item.type_of_product &&
            !updated.some((opt) => opt.value === item.type_of_product)
          ) {
            updated.push({
              label: item.type_of_product,
              value: item.type_of_product,
            });
          }
        });
        return updated;
      });

      setItemOptions((prev) => {
        const updated = { ...prev };
        editableItems.forEach((item) => {
          if (item.type_of_product) {
            if (!updated[item.type_of_product])
              updated[item.type_of_product] = [];
            if (
              item.description &&
              !updated[item.type_of_product].some(
                (opt) => opt.value === item.description
              )
            ) {
              updated[item.type_of_product].push({
                label: item.description,
                value: item.description,
              });
            }
          }
        });
        return updated;
      });
    }
  }, [editableItems]);

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === "") return "";
    const num = parseFloat(value.toString().replace(/,/g, ""));
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
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header
        closeButton
        closeVariant="white"
        style={{ backgroundColor: "#008f4c" }}
      >
        <Modal.Title className="text-white">Update Delivery Info</Modal.Title>
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
                    setFormData({ ...formData, customer_name: e.target.value })
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
                    setFormData({ ...formData, payment_option: e.target.value })
                  }
                >
                  <option value="Full Payment">Full Payment</option>
                  <option value="Down Payment">Down Payment</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Down Payment</Form.Label>
                <Form.Control
                  type="text"
                  value={
                    formData.down_payment !== ""
                      ? `₱${formData.down_payment}`
                      : ""
                  }
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/[₱,]/g, "");
                    const numericValue =
                      rawValue === "" ? "" : parseFloat(rawValue);
                    const balance =
                      total -
                      (isNaN(numericValue) ? 0 : numericValue) -
                      (parseFloat(formData.full_payment) || 0);

                    setFormData({
                      ...formData,
                      down_payment: isNaN(numericValue) ? "" : numericValue,
                      balance: balance.toFixed(2),
                      total: total.toFixed(2),
                    });
                  }}
                  onBlur={(e) => {
                    const rawValue = e.target.value.replace(/[₱,]/g, "");
                    const numericValue = parseFloat(rawValue);
                    if (!isNaN(numericValue)) {
                      setFormData({
                        ...formData,
                        down_payment: numericValue.toFixed(2),
                        balance: (
                          total -
                          numericValue -
                          (parseFloat(formData.full_payment) || 0)
                        ).toFixed(2),
                        total: total.toFixed(2),
                      });
                      e.target.value =
                        "₱" +
                        numericValue.toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        });
                    }
                  }}
                  disabled={formData.payment_option === "Full Payment"}
                />
              </Form.Group>

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
                        formData.full_payment !== ""
                          ? `₱${formData.full_payment}`
                          : "₱0"
                      }
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/[₱,]/g, "");
                        const numericValue =
                          rawValue === "" ? "" : parseFloat(rawValue);
                        const balance =
                          total -
                          (parseFloat(formData.down_payment) || 0) -
                          (isNaN(numericValue) ? 0 : numericValue);

                        setFormData({
                          ...formData,
                          full_payment: isNaN(numericValue) ? "" : numericValue,
                          balance: balance.toFixed(2),
                        });
                      }}
                      onBlur={(e) => {
                        const rawValue = e.target.value.replace(/[₱,]/g, "");
                        const numericValue = parseFloat(rawValue);
                        if (!isNaN(numericValue)) {
                          setFormData({
                            ...formData,
                            full_payment: numericValue.toFixed(2),
                            balance: (
                              total -
                              (parseFloat(formData.down_payment) || 0) -
                              numericValue
                            ).toFixed(2),
                          });
                          e.target.value =
                            "₱" +
                            numericValue.toLocaleString("en-PH", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            });
                        }
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
                      <CreatableSelect
                        options={productOptions}
                        value={
                          productOptions.find(
                            (opt) => opt.value === item.type_of_product
                          ) ||
                          (item.type_of_product
                            ? {
                                label: item.type_of_product,
                                value: item.type_of_product,
                              }
                            : null)
                        }
                        onChange={(selected) =>
                          handleProductChange(index, selected)
                        }
                        placeholder="Select type"
                        isSearchable
                      />
                    </td>

                    <td>
                      <CreatableSelect
                        options={itemOptions[item.type_of_product] || []}
                        value={
                          (itemOptions[item.type_of_product] || []).find(
                            (opt) => opt.value === item.description
                          ) ||
                          (item.description
                            ? {
                                label: item.description,
                                value: item.description,
                              }
                            : null)
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
                          item.unit_cost !== "" ? `₱${item.unit_cost}` : ""
                        }
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/[₱,]/g, "");
                          const numericValue =
                            rawValue === "" ? "" : parseFloat(rawValue);

                          const newItems = [...editableItems];
                          newItems[index].unit_cost = isNaN(numericValue)
                            ? ""
                            : numericValue;
                          setEditableItems(newItems);
                        }}
                        onBlur={(e) => {
                          const rawValue = e.target.value.replace(/[₱,]/g, "");
                          const numericValue = parseFloat(rawValue);
                          if (!isNaN(numericValue)) {
                            const newItems = [...editableItems];
                            newItems[index].unit_cost = numericValue.toFixed(2);
                            setEditableItems(newItems);
                            e.target.value =
                              "₱" +
                              numericValue.toLocaleString("en-PH", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              });
                          }
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
  );
};

export default UpdateOrderModal;
