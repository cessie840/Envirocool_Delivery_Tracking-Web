import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import axios from "axios";
import { FaRegTrashAlt, FaArrowLeft, FaChevronDown } from "react-icons/fa";
import { Button, Modal } from "react-bootstrap";

const AddDelivery = () => {
  const navigate = useNavigate();

  const [transactionId, setTransactionId] = useState("Loading...");
  const [poId, setPoId] = useState("Loading...");
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [form, setForm] = useState({
    customer_name: "",
    customer_address: "",
    customer_contact: "",
    date_of_order: "",
    mode_of_payment: "",
    down_payment: "",
    balance: "",
    total: "",
  });

  const handleConfirmCancel = () => {
    setShowCancelModal(false);

    // Clear form
    setForm({
      customer_name: "",
      customer_address: "",
      customer_contact: "",
      date_of_order: "",
      mode_of_payment: "",
      down_payment: "",
      balance: "",
      total: "",
    });

    // Clear order items
    setOrderItems([
      {
        quantity: "",
        description: "",
        unit_cost: "",
        total_cost: "",
      },
    ]);

    // Redirect to admin dashboard
    navigate("/delivery-details");
  };

  const [orderItems, setOrderItems] = useState([
    { quantity: "", description: "", unit_cost: "", total_cost: "" },
  ]);

  useEffect(() => {
    document.title = "Add Delivery";
    fetchLatestIDs();
  }, []);

  const fetchLatestIDs = async () => {
    try {
      const res = await axios.get(
        "http://localhost/DeliveryTrackingSystem/get_latest_ids.php"
      );
      setTransactionId(res.data.transaction_id);
      setPoId(res.data.po_id);
    } catch (error) {
      console.error("Error fetching latest IDs", error);
      setTransactionId("Error");
      setPoId("Error");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    let updatedForm = {
      ...form,
      [name]: value,
    };

    if (name === "down_payment") {
      const downPayment = parseFloat(value);
      const totalCost = orderItems.reduce((sum, item) => {
        const cost = parseFloat(item.total_cost);
        return sum + (isNaN(cost) ? 0 : cost);
      }, 0);

      if (!isNaN(downPayment) && !isNaN(totalCost)) {
        const balance = totalCost - downPayment;
        updatedForm.balance = balance.toFixed(2);
        updatedForm.total = totalCost.toFixed(2);
      } else {
        updatedForm.balance = "";
        updatedForm.total = "";
      }
    }

    setForm(updatedForm);
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const items = [...orderItems];
    items[index][name] = value;

    const quantity = parseFloat(items[index].quantity);
    const unitCost = parseFloat(items[index].unit_cost);

    if (!isNaN(quantity) && !isNaN(unitCost)) {
      items[index].total_cost = (quantity * unitCost).toFixed(2);
    }

    setOrderItems(items);

    const totalCostSum = items.reduce((sum, item) => {
      const cost = parseFloat(item.total_cost);
      return sum + (isNaN(cost) ? 0 : cost);
    }, 0);

    setForm((prevForm) => ({
      ...prevForm,
      total: totalCostSum.toFixed(2),
      balance: (totalCostSum - parseFloat(prevForm.down_payment || 0)).toFixed(
        2
      ),
    }));
  };

  const addNewItem = () => {
    setOrderItems([
      ...orderItems,
      { quantity: "", description: "", unit_cost: "", total_cost: "" },
    ]);
  };

  const removeItem = (index) => {
    const updatedItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(updatedItems);

    const totalCostSum = updatedItems.reduce((sum, item) => {
      const cost = parseFloat(item.total_cost);
      return sum + (isNaN(cost) ? 0 : cost);
    }, 0);

    setForm((prevForm) => ({
      ...prevForm,
      total: totalCostSum.toFixed(2),
      balance: (totalCostSum - parseFloat(prevForm.down_payment || 0)).toFixed(
        2
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^09\d{9}$/.test(form.customer_contact)) {
      alert("Contact number must start with '09' and be exactly 11 digits.");
      return;
    }

    for (const item of orderItems) {
      const quantity = parseInt(item.quantity);
      const unitCost = parseFloat(item.unit_cost);

      if (isNaN(quantity) || quantity < 1) {
        alert("Each item's quantity must be a number and at least 1.");
        return;
      }

      if (isNaN(unitCost) || unitCost < 0) {
        alert("Each item's unit cost must be a non-negative number.");
        return;
      }
    }

    const dataToSend = {
      ...form,
      order_items: orderItems,
    };

    try {
      const res = await axios.post(
        "http://localhost/DeliveryTrackingSystem/add_delivery.php",
        dataToSend,
        { headers: { "Content-Type": "application/json" } }
      );

      alert("Delivery added successfully!");

      setForm({
        customer_name: "",
        customer_address: "",
        customer_contact: "",
        date_of_order: "",
        mode_of_payment: "",
        down_payment: "",
        balance: "",
        total: "",
      });

      setOrderItems([
        { quantity: "", description: "", unit_cost: "", total_cost: "" },
      ]);

      fetchLatestIDs();
    } catch (error) {
      console.error("Error submitting form", error);
      alert("Error saving delivery.");
    }
  };

  return (
    <AdminLayout title="Add Delivery" showSearch={false}>
      <div className="d-flex justify-content-start mt-4 ms-4">
        <button
          className="btn back-btn d-flex align-items-center gap-2 fs-5"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft /> Back
        </button>
      </div>
      <div className="add-delivery-container mt-4 p-4 border rounded mx-auto">
        <div className="header-info mb-3">
          <p>
            <strong>Transaction No.:</strong> {transactionId}
          </p>
          <p>
            <strong>P.O. No.:</strong> {poId}
          </p>
        </div>
        <hr />

        <form className="delivery-form" onSubmit={handleSubmit}>
          <h4 className="mb-3">Customer Details</h4>
          <div className="row mb-3">
            <div className="col-md-6">
              <label htmlFor="customerName" className="form-label">
                Enter Customer's Name:
              </label>
              <input
                type="text"
                className="form-control"
                id="customerName"
                name="customer_name"
                value={form.customer_name}
                placeholder="Customer's Name"
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="dateOfOrder" className="form-label">
                Date of Order:
              </label>
              <input
                type="date"
                className="form-control"
                id="dateOfOrder"
                name="date_of_order"
                value={form.date_of_order}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="customerAddress" className="form-label">
              Enter Customer's Address:
            </label>
            <input
              type="text"
              className="form-control"
              id="customerAddress"
              name="customer_address"
              value={form.customer_address}
              placeholder="Customer's Address"
              onChange={handleChange}
              required
            />
          </div>

          <div className="row mb-4">
            <div className="col-md-6">
              <label htmlFor="contactNumber" className="form-label">
                Enter Customer's Contact Number:
              </label>
              <input
                type="text"
                className="form-control"
                id="contactNumber"
                name="customer_contact"
                value={form.customer_contact}
                placeholder="Customer's Contact No."
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label d-block container-fluid">
                Mode of Payment:
              </label>
              <div className="MOP d-flex justify-content-center gap-5 gap-md-5 container-fluid">
                {["Cash", "COD", "Card"].map((method) => (
                  <div
                    className="form-check d-flex align-items-center"
                    key={method}
                  >
                    <input
                      className="form-check-input me-2"
                      type="radio"
                      name="mode_of_payment"
                      id={method.toLowerCase()}
                      value={method}
                      checked={form.mode_of_payment === method}
                      onChange={handleChange}
                      required
                    />
                    <label
                      className="form-check-label"
                      htmlFor={method.toLowerCase()}
                    >
                      {method}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="order-details mt-5">
            <h4 className="mb-4">Order Details</h4>
            <table className="order-table table">
              <thead>
                <tr>
                  <th>Quantity</th>
                  <th>Item Name</th>
                  <th>Unit Cost</th>
                  <th>Total Cost</th>
                  {orderItems.length > 1 && <th className="no-header"></th>}
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="number"
                        name="quantity"
                        placeholder="0"
                        className="form-control"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, e)}
                        required
                      />
                    </td>
                    <td>
                      <div className="dropdown-wrapper">
                        <select
                          name="description"
                          className="form-control item-dropdown"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, e)}
                          required
                        >
                          <option value="">Select an item</option>
                          <option value="Carrier Aura Inverter Split Type 1.5HP">
                            Carrier Aura Inverter Split Type 1.5HP
                          </option>
                          <option value="Panasonic Deluxe Window Type 1.0HP">
                            Panasonic Deluxe Window Type 1.0HP
                          </option>
                          <option value="LG DualCool Inverter Split Type 2.0HP">
                            LG DualCool Inverter Split Type 2.0HP
                          </option>
                        </select>
                        <FaChevronDown className="dropdown-icon" />
                      </div>
                    </td>

                    <td>
                      <input
                        type="number"
                        name="unit_cost"
                        placeholder="₱0.00"
                        className="form-control"
                        value={item.unit_cost}
                        onChange={(e) => handleItemChange(index, e)}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="total_cost"
                        placeholder="₱0.00"
                        className="form-control"
                        value={item.total_cost}
                        onChange={(e) => handleItemChange(index, e)}
                        required
                      />
                    </td>
                    {orderItems.length > 1 && (
                      <td className="align-middle remove-btn-cell">
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => removeItem(index)}
                        >
                          <FaRegTrashAlt size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="d-flex justify-content-end mt-2">
              <button
                type="button"
                className="btn add-item"
                onClick={addNewItem}
              >
                ✚ Add Another Item
              </button>
            </div>

            <div className="order-summary mt-4">
              <label>
                Down Payment:
                <input
                  type="number"
                  name="down_payment"
                  placeholder="₱0.00"
                  step="0.01"
                  value={form.down_payment}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Balance:
                <input
                  type="number"
                  name="balance"
                  placeholder="₱0.00"
                  step="0.01"
                  value={form.balance}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Total:
                <input
                  type="number"
                  name="total"
                  placeholder="₱0.00"
                  step="0.01"
                  value={form.total}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>
            <hr className="mt-4" />
            <div className="btn-group mx-3 mt-4 fs-6 gap-4">
              <button
                type="button"
                className="cancel-btn bg-danger"
                onClick={() => setShowCancelModal(true)}
              >
                Cancel
              </button>
              <Modal
                show={showCancelModal}
                onHide={() => setShowCancelModal(false)}
                centered
              >
                <Modal.Header closeButton>
                  <Modal.Title className="text-danger">
                    Confirm Cancellation
                  </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  Are you sure you want to cancel adding this delivery?
                </Modal.Body>
                <Modal.Footer>
                  <Button
                    variant="secondary"
                    onClick={() => setShowCancelModal(false)}
                  >
                    No
                  </Button>
                  <Button variant="danger" onClick={handleConfirmCancel}>
                    Yes, Cancel
                  </Button>
                </Modal.Footer>
              </Modal>
              <button type="submit" className="add-btn bg-success">
                Add
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AddDelivery;
