import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import axios from "axios";

const AddDelivery = () => {
  const navigate = useNavigate();

  const [transactionId, setTransactionId] = useState("Loading...");
  const [poId, setPoId] = useState("Loading...");

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

  const [orderItem, setOrderItem] = useState({
    quantity: "",
    description: "",
    unit_cost: "",
    total_cost: "",
  });

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

    // If down_payment is updated, recalculate balance and total
    if (name === "down_payment") {
      const downPayment = parseFloat(value);
      const totalCost = parseFloat(orderItem.total_cost);

      if (!isNaN(downPayment) && !isNaN(totalCost)) {
        const balance = totalCost - downPayment;
        updatedForm.balance = balance.toFixed(2);
        updatedForm.total = (downPayment + balance).toFixed(2);
      } else {
        updatedForm.balance = "";
        updatedForm.total = "";
      }
    }

    setForm(updatedForm);
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    const updatedItem = {
      ...orderItem,
      [name]: value,
    };

    // Auto-calculate total_cost when quantity and unit_cost are available
    if (name === "quantity" || name === "unit_cost") {
      const quantity = parseFloat(
        name === "quantity" ? value : updatedItem.quantity
      );
      const unitCost = parseFloat(
        name === "unit_cost" ? value : updatedItem.unit_cost
      );

      if (!isNaN(quantity) && !isNaN(unitCost)) {
        updatedItem.total_cost = (quantity * unitCost).toFixed(2);
      } else {
        updatedItem.total_cost = "";
      }
    }

    setOrderItem(updatedItem);

    // Update total in form too
    setForm((prevForm) => ({
      ...prevForm,
      total: updatedItem.total_cost,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^09\d{9}$/.test(form.customer_contact)) {
      alert("Contact number must start with '09' and be exactly 11 digits.");
      return;
    }

    const quantity = parseInt(orderItem.quantity);
    if (isNaN(quantity) || quantity < 1) {
      alert("Quantity must be a number and at least 1.");
      return;
    }

    const unitCost = parseFloat(orderItem.unit_cost);
    if (isNaN(unitCost) || unitCost < 0) {
      alert("Unit cost must be a non-negative number.");
      return;
    }

    const dataToSend = {
      ...form,
      order_items: [orderItem],
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

      setOrderItem({
        quantity: "",
        description: "",
        unit_cost: "",
        total_cost: "",
      });

      fetchLatestIDs();
    } catch (error) {
      console.error("Error submitting form", error);
      alert("Error saving delivery.");
    }
  };

  return (
    <AdminLayout title="Add Delivery">
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
              <div className="MOP d-flex justify-content-center gap-4 gap-md-3 container-fluid">
                {["Cash", "COD", "Card"].map((method) => (
                  <div className="form-check d-flex" key={method}>
                    <label
                      className="form-check-label me-5 mx-md-4.5"
                      htmlFor={method.toLowerCase()}
                    >
                      {method}
                    </label>
                    <input
                      className="form-check-input"
                      type="radio"
                      name="mode_of_payment"
                      id={method.toLowerCase()}
                      value={method}
                      checked={form.mode_of_payment === method}
                      onChange={handleChange}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="order-details mt-5">
            <h4 className="mb-4">Order Details</h4>
            <table className="order-table">
              <thead>
                <tr>
                  <th>Quantity</th>
                  <th>Description</th>
                  <th>Unit Cost</th>
                  <th>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <input
                      type="number"
                      name="quantity"
                      min="1" //
                      placeholder="0"
                      value={orderItem.quantity}
                      onChange={handleItemChange}
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      name="description"
                      placeholder="Item description"
                      value={orderItem.description}
                      onChange={handleItemChange}
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="unit_cost"
                      placeholder="₱0.00"
                      step="0.01"
                      value={orderItem.unit_cost}
                      onChange={handleItemChange}
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="total_cost"
                      placeholder="₱0.00"
                      step="0.01"
                      value={orderItem.total_cost}
                      onChange={handleItemChange}
                      required
                    />
                  </td>
                </tr>
              </tbody>
            </table>

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

            <div className="btn-group mx-3 mt-4 fs-6 gap-4">
              <button type="reset" className="cancel-btn bg-danger">
                Cancel
              </button>
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
