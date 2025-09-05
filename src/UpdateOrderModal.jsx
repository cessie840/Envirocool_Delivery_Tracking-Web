import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import axios from "axios";
import { FaTrash, FaPlusCircle } from "react-icons/fa";

const paymentOptions = [
  { label: "CASH", value: "Cash" },
  { label: "GCASH", value: "GCASH" },
  {
    label: "Bank Transfer",
    options: [
      { label: "Bank 1", value: "Bank 1" },
      { label: "Bank 2", value: "Bank 2" },
      { label: "Bank 3", value: "Bank 3" },
    ],
  },
  {
    label: "Card",
    options: [
      { label: "Card 1", value: "Visa" },
      { label: "Card 2", value: "Mastercard" },
      { label: "Card 3", value: "AmEx" },
    ],
  },
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

  // Ensure old transaction values appear in dropdowns
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

  // Handle product type change
  const handleProductChange = (index, selected) => {
    const newItems = [...editableItems];
    newItems[index].type_of_product = selected?.value || "";
    newItems[index].description = ""; // reset item when product changes
    setEditableItems(newItems);
  };

  // Handle item name change
  const handleItemChange = (index, selected) => {
    const newItems = [...editableItems];
    newItems[index].description = selected?.value || "";
    setEditableItems(newItems);
  };

  const handleDownPaymentChange = (e) => {
    const down_payment = parseFloat(e.target.value) || 0;
    const balance = total - down_payment;
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

  // Add new empty item row
  const handleAddItem = () => {
    setEditableItems([
      ...editableItems,
      { quantity: 1, type_of_product: "", description: "", unit_cost: 0 },
    ]);
  };



  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton className="bg-success" closeVariant="white">
        <Modal.Title className="text-white">Update Delivery Info</Modal.Title>
      </Modal.Header>

      <Modal.Body className="bg-light">
        <Form>
          {/* Two Column Layout */}
          <Row className="p-3 bg-white rounded shadow-sm border mb-4">
            {/* Left Column - Customer Info */}
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
                  value={formData.target_date_delivery || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      target_date_delivery: e.target.value,
                    })
                  }
                />
              </Form.Group>
            </Col>

            {/* Right Column - Payment Info */}
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
                  type="number"
                  step="0.01"
                  name="down_payment"
                  value={formData.down_payment}
                  onChange={handleDownPaymentChange}
                  disabled={formData.payment_option === "Full Payment"}
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Items Section */}
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
                  <th style={{ width: "20%" }}>Quantity</th>
                  <th style={{ width: "30%" }}>Type of Product</th>
                  <th style={{ width: "30%" }}>Item Name</th>
                  <th style={{ width: "20%" }}>Unit Cost</th>
                </tr>
              </thead>
              <tbody className="text-center">
                {editableItems.map((item, index) => (
                  <tr key={index}>
                    {/* Quantity */}
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

                    {/* Type of Product */}
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

                    {/* Item Name */}
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

                    {/* Unit Cost */}
                    <td>
                      <Form.Control
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unit_cost}
                        onChange={(e) => {
                          const newItems = [...editableItems];
                          newItems[index].unit_cost =
                            parseFloat(e.target.value) || 0;
                          setEditableItems(newItems);
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
          className="cancel-btn btn btn- d-flex align-items-center gap-2"
          onClick={handleClose}
        >
          Cancel
        </Button>
        <Button
          className="upd-btn btn-success d-flex align-items-center gap-2"
          style={{fontSize: "16px"}}
          onClick={handleSubmit}
        >
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UpdateOrderModal;
