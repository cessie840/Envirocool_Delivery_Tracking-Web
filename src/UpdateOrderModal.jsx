import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import Select from "react-select";
import axios from "axios";
import { FaPlusCircle } from "react-icons/fa";

const paymentOptions = [
  { label: "CASH", value: "Cash" },
  { label: "BANK TRANSFER", value: "Bank Transfer" },
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

  

  // ✅ Fetch data from database
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

  // ✅ Currency helpers
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

  const handleAddItem = () => {
    setEditableItems([
      ...editableItems,
      { quantity: 1, type_of_product: "", description: "", unit_cost: 0 },
    ]);
  };

  const selectedPaymentOption = paymentOptions.find(
    (opt) => opt.value === formData.mode_of_payment
  );

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
          {/* 🧾 Customer Info */}
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

            {/* 💰 Payment Info */}
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
                      total - (isNaN(numericValue) ? 0 : numericValue);

                    setFormData({
                      ...formData,
                      down_payment: isNaN(numericValue) ? "" : numericValue,
                      balance: balance.toFixed(2),
                      total: total.toFixed(2),
                    });
                  }}
                  disabled={formData.payment_option === "Full Payment"}
                />
              </Form.Group>
            </Col>
          </Row>

          {/* 📦 Items Ordered */}
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
              <thead className="table-success text-center">
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

                    {/* ✅ Product dropdown (database only) */}
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

                    {/* ✅ Item dropdown (filtered by selected product) */}
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
                        isDisabled={!item.type_of_product}
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
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          className="btn-success"
          style={{ fontSize: "16px" }}
          onClick={handleSubmit}
        >
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UpdateOrderModal;
