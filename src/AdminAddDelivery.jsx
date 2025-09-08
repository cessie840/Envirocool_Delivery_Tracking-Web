import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import axios from "axios";
import { FaRegTrashAlt, FaArrowLeft } from "react-icons/fa";
import { Button, Modal } from "react-bootstrap";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";

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

const AddDelivery = () => {
  const [products, setProducts] = useState([]);
  const [itemOptions, setItemOptions] = useState({});
  const [productOptions, setProductOptions] = useState([]);
  const [dpError, setDpError] = useState("");
  const [contactError, setContactError] = useState("");



  const navigate = useNavigate();

  const [transactionId, setTransactionId] = useState("Loading...");
  const [poId, setPoId] = useState("Loading...");
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [form, setForm] = useState({
    customer_name: "",
    customer_address: "",
    customer_contact: "",
    date_of_order: "",
    target_date_delivery: "",
    payment_method: "",
    payment_option: "",
    full_payment: "",
    fp_collection_date: "",
    down_payment: "",
    dp_collection_date: "",
    balance: "",
    total: "",
  });
const handleContactChange = (e) => {
  const value = e.target.value;
  setForm((prev) => ({ ...prev, customer_contact: value }));

  // Validate contact number
  if (!value.startsWith("0")) {
    setContactError("Contact number must start with '0'.");
  } else if (value.length > 11) {
    setContactError("Contact number cannot exceed 11 digits.");
  } else {
    setContactError("");
  }
};


  const handleUnitCostChange = (index, e) => {
    const rawValue = parsePeso(e.target.value);
    const updatedItems = [...orderItems];

    updatedItems[index].unit_cost = rawValue;

    const quantity = parseInt(updatedItems[index].quantity) || 0;
    const unitCost = parseFloat(rawValue) || 0;
    updatedItems[index].total_cost = (unitCost * quantity).toFixed(2);

    setOrderItems(updatedItems);
    recalcTotal(updatedItems);
  };

  const handleUnitCostBlur = (index) => {
    const updatedItems = [...orderItems];
    updatedItems[index].unit_cost = formatPeso(
      parseFloat(updatedItems[index].unit_cost)
    );
    setOrderItems(updatedItems);
  };

  const handleUnitCostFocus = (index) => {
    const updatedItems = [...orderItems];
    updatedItems[index].unit_cost = parsePeso(updatedItems[index].unit_cost);
    setOrderItems(updatedItems);
  };

  const handleDownPaymentFocus = () => {
    setForm((prev) => ({
      ...prev,
      down_payment: parsePeso(prev.down_payment),
    }));
  };

  const handleDownPaymentBlur = () => {
    setForm((prev) => ({
      ...prev,
      down_payment: formatPeso(prev.down_payment),
    }));
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const updatedItems = [...orderItems];
    updatedItems[index][name] = value;

    if (name === "quantity" || name === "unit_cost") {
      const quantity = parseInt(updatedItems[index].quantity) || 0;
      const unitCost =
        parseFloat(parsePeso(updatedItems[index].unit_cost)) || 0;
      updatedItems[index].total_cost = (unitCost * quantity).toFixed(2);
    }

    setOrderItems(updatedItems);
    recalcTotal(updatedItems);
  };

  const recalcTotal = (updatedItems) => {
    const totalCost = updatedItems.reduce((sum, item) => {
      const cost = parseFloat(item.total_cost);
      return sum + (isNaN(cost) ? 0 : cost);
    }, 0);

    if (form.payment_option === "Down Payment") {
      const downPayment = parseFloat(form.down_payment) || 0;
      setForm((prevForm) => ({
        ...prevForm,
        total: totalCost.toFixed(2),
        balance: (totalCost - downPayment).toFixed(2),
      }));
    } else {
      setForm((prevForm) => ({
        ...prevForm,
        total: totalCost.toFixed(2),
        balance: "",
      }));
    }
  };

  const formatPeso = (value) => {
    if (value === "" || value === null || isNaN(value)) return "";
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const parsePeso = (value) => {
    if (!value) return "";
    return value.toString().replace(/[^0-9.]/g, "");
  };

  const handleConfirmCancel = () => {
    setShowCancelModal(false);

    setForm({
      customer_name: "",
      customer_address: "",
      customer_contact: "",
      date_of_order: "",
      target_date_delivery: "",
      payment_method: "",
      payment_option: "",
      full_payment: "",
      fp_collection_date: "",
      down_payment: "",
      dp_collection_date: "",
      balance: "",
      total: "",
    });

    setOrderItems([
      {
        quantity: "",
        type_of_product: "",
        description: "",
        unit_cost: "",
        total_cost: "",
      },
    ]);

    navigate("/delivery-details");
  };

  const [orderItems, setOrderItems] = useState([
    {
      quantity: "",
      type_of_product: "",
      description: "",
      unit_cost: "",
      total_cost: "",
    },
  ]);

  useEffect(() => {
    document.title = "Add Delivery";
    fetchLatestIDs();

    const fetchProducts = async () => {
      try {
        const res = await axios.get(
          "http://localhost/DeliveryTrackingSystem/get_products.php"
        );
        setProductOptions(res.data);

        const itemsRes = await axios.get(
          "http://localhost/DeliveryTrackingSystem/get_items.php"
        );
        setItemOptions(itemsRes.data);
      } catch (err) {
        console.error("Error loading products", err);
      }
    };

    fetchProducts();
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
      const downPayment = parseFloat(value) || 0;
      const totalCost = orderItems.reduce((sum, item) => {
        const cost = parseFloat(item.total_cost) || 0;
        return sum + cost;
      }, 0);

      if (downPayment > totalCost) {
        setDpError("Down Payment cannot exceed Total Amount");
      } else {
        setDpError(""); 
      }

      updatedForm.balance = (totalCost - downPayment).toFixed(2);
      updatedForm.total = totalCost.toFixed(2);
    }


    if (name === "down_payment" || name === "payment_option") {
      const downPayment = parseFloat(
        name === "down_payment" ? value : form.down_payment
      );
      const totalCost = orderItems.reduce((sum, item) => {
        const cost = parseFloat(item.total_cost);
        return sum + (isNaN(cost) ? 0 : cost);
      }, 0);

      if (value === "Full Payment") {
        updatedForm.full_payment = totalCost.toFixed(2);
        updatedForm.down_payment = "";
        updatedForm.dp_collection_date = "";
        updatedForm.balance = "";
        updatedForm.total = totalCost.toFixed(2);
      } else if (value === "Down Payment") {
        updatedForm.full_payment = "";
        updatedForm.fp_collection_date = "";
        updatedForm.total = totalCost.toFixed(2);
      }
    }

    if (name === "down_payment" || name === "payment_option") {
      const downPayment = parseFloat(
        name === "down_payment" ? value : form.down_payment
      );

      const totalCost = orderItems.reduce((sum, item) => {
        const cost = parseFloat(item.total_cost);
        return sum + (isNaN(cost) ? 0 : cost);
      }, 0);

      if (
        (name === "payment_option" && value === "Full Payment") ||
        form.payment_option === "Full Payment"
      ) {
        updatedForm.balance = "";
        updatedForm.total = totalCost.toFixed(2);
      } else if (!isNaN(downPayment) && !isNaN(totalCost)) {
        updatedForm.balance = (totalCost - downPayment).toFixed(2);
        updatedForm.total = totalCost.toFixed(2);
      } else {
        updatedForm.balance = "";
        updatedForm.total = "";
      }
    }

    setForm(updatedForm);
  };

  const addNewItem = () => {
    setOrderItems([
      ...orderItems,
      {
        quantity: "",
        type_of_product: "",
        description: "",
        unit_cost: "",
        total_cost: "",
      },
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

  if (!form.payment_method) {
    alert("Please select a payment method.");
    return;
  }

   for (const [index, item] of orderItems.entries()) {
     const quantity = parseInt(item.quantity);
     const unitCost = parseFloat(parsePeso(item.unit_cost));
     const typeOfProduct = item.type_of_product?.trim();
     const description = item.description?.trim();

     if (!typeOfProduct) {
       alert(`Please select a type of product for item #${index + 1}`);
       return;
     }

     if (!description) {
       alert(`Please select an item name for item #${index + 1}`);
       return;
     }

     if (isNaN(quantity) || quantity < 1) {
       alert(`Quantity for item #${index + 1} must be at least 1`);
       return;
     }

     if (isNaN(unitCost) || unitCost < 0) {
       alert(`Unit cost for item #${index + 1} must be a non-negative number`);
       return;
     }
   }


    const normalizedOrderItems = orderItems.map((item) => ({
      quantity: parseInt(item.quantity) || 0,
      type_of_product: item.type_of_product,
      description: item.description,
      unit_cost: parseFloat(parsePeso(item.unit_cost)) || 0,
      total_cost: parseFloat(item.total_cost) || 0,
    }));

    const dataToSend = {
      ...form,
      down_payment: parseFloat(parsePeso(form.down_payment)) || 0,
      full_payment: parseFloat(parsePeso(form.full_payment)) || 0,
      total: parseFloat(parsePeso(form.total)) || 0,
      order_items: normalizedOrderItems,
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
        target_date_delivery: "",
        date_of_order: "",
        payment_method: "",
        payment_option: "",
        full_payment: "",
        fp_collection_date: "",
        down_payment: "",
        dp_collection_date: "",
        balance: "",
        total: "",
      });

      setOrderItems([
        {
          quantity: "",
          type_of_product: "",
          description: "",
          unit_cost: "",
          total_cost: "",
        },
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
          className="back-btn btn-success d-flex align-items-center gap-2"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft /> Back
        </button>
      </div>
      <div className="add-delivery-container mt-4 p-4 mx-auto mb-3">
        <div className="header-info m-3 d-flex justify-content-between">
          <h4>
            <strong>Transaction No.:</strong> {transactionId}
          </h4>
          <h4>
            <strong>P.O. No.:</strong> {poId}
          </h4>
        </div>

        <form
          id="deliveryForm"
          className="delivery-form bg-white"
          onSubmit={handleSubmit}
        >
          <h4 className="mb-3">Customer Details</h4>

          <div className="row mb-3">
            <div className="col-md-6">
              <label htmlFor="customerName" className="form-label">
                Enter Client's Name:
              </label>
              <input
                type="text"
                className="form-control"
                id="customerName"
                name="customer_name"
                value={form.customer_name}
                placeholder="Client's Name"
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
                className={`form-control ${
                  form.date_of_order ? "text-black" : "text-muted"
                }`}
                id="dateOfOrder"
                name="date_of_order"
                value={form.date_of_order}
                onChange={handleChange}
                required
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="customerAddress" className="form-label">
              Enter Client's Address:
            </label>
            <input
              type="text"
              className="form-control"
              id="customerAddress"
              name="customer_address"
              value={form.customer_address}
              placeholder="Client's Address"
              onChange={handleChange}
              required
            />
          </div>

          <div className="row mb-4">
            <div className="col-md-6">
              <label htmlFor="contactNumber" className="form-label">
                Enter Client's Contact Number:
              </label>
              <input
                type="text"
                className={`form-control ${contactError ? "is-invalid" : ""}`}
                id="contactNumber"
                name="customer_contact"
                value={form.customer_contact}
                placeholder="Client's Contact No."
                onChange={handleContactChange}
                required
              />
              {contactError && (
                <div className="invalid-feedback">{contactError}</div>
              )}
            </div>
            <div className="col-md-6">
              <label htmlFor="dateOfOrder" className="form-label">
                Date of Deliver:
              </label>
              <input
                style={{ color: "gray" }}
                type="date"
                id="targetDate"
                name="target_date_delivery"
                className={`form-control ${
                  form.target_date_delivery ? "text-black" : "text-muted"
                }`}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="order-details mt-5">
            <h4 className="mb-4">Order Details</h4>
            <table className="order-table table">
              <thead>
                <tr>
                  <th style={{ width: "80px" }}>Quantity</th>
                  <th style={{ width: "200px" }}>Type of Product</th>
                  <th style={{ width: "200px" }}>Item Name</th>
                  <th style={{ width: "150px" }}>Unit Cost</th>
                  <th style={{ width: "150px" }}>Total Cost</th>
                  {orderItems.length > 1 && <th className="no-header"></th>}
                </tr>
              </thead>

              <tbody>
                {orderItems.map((item, index) => (
                  <tr key={index}>
                    <td style={{ width: "80px" }}>
                      <input
                        type="number"
                        name="quantity"
                        min={1}
                        placeholder="0"
                        className="form-control"
                        value={item.quantity}
                        onChange={(e) => {
                          const value = Math.max(
                            1,
                            parseInt(e.target.value) || 1
                          );
                          handleItemChange(index, {
                            target: { name: "quantity", value },
                          });
                        }}
                        required
                      />
                    </td>

                    <td style={{ width: "200px" }}>
                      <CreatableSelect
                        options={productOptions}
                        value={
                          productOptions.find(
                            (opt) => opt.value === item.type_of_product
                          ) || null
                        }
                        onChange={(selected) => {
                          const e = {
                            target: {
                              name: "type_of_product",
                              value: selected?.value || "",
                            },
                          };
                          handleItemChange(index, e);
                        }}
                        onCreateOption={async (newValue) => {
                          const newOption = {
                            label: newValue,
                            value: newValue,
                          };

                          setProductOptions((prev) => {
                            const exists = prev.some(
                              (opt) =>
                                opt.value.toLowerCase() ===
                                newValue.toLowerCase()
                            );
                            return exists ? prev : [...prev, newOption];
                          });

                          try {
                            await axios.post(
                              "http://localhost/DeliveryTrackingSystem/save_product.php",
                              {
                                type_of_product: newValue,
                                description: "",
                                unit_cost: 0,
                              }
                            );
                          } catch (err) {
                            console.error("Error saving product type", err);
                          }
                          const e = {
                            target: {
                              name: "type_of_product",
                              value: newValue,
                            },
                          };

                          handleItemChange(index, {
                            target: {
                              name: "type_of_product",
                              value: newValue,
                            },
                          });
                        }}
                        placeholder="Select type"
                        isSearchable
                        styles={{
                          control: (provided) => ({
                            ...provided,

                            minHeight: "41px",
                            height: "41px",
                          }),
                          valueContainer: (provided) => ({
                            ...provided,
                            height: "41px",
                            padding: "0 8px",
                          }),
                          input: (provided) => ({
                            ...provided,
                            margin: 0,
                            padding: 0,
                          }),
                          indicatorsContainer: (provided) => ({
                            ...provided,
                            height: "41px",
                          }),
                          placeholder: (provided) => ({
                            ...provided,
                            textTransform: "none",
                            color: "#b4b4b4",
                            opacity: "1",
                          }),
                        }}
                      />
                    </td>

                    <td>
                      <CreatableSelect
                        options={itemOptions[item.type_of_product] || []}
                        value={
                          itemOptions[item.type_of_product]?.find(
                            (opt) => opt.value === item.description
                          ) || null
                        }
                        onChange={(selected) => {
                          const e = {
                            target: {
                              name: "description",
                              value: selected?.value || "",
                            },
                          };
                          handleItemChange(index, e);
                        }}
                        onCreateOption={async (newValue) => {
                          const newOption = {
                            label: newValue,
                            value: newValue,
                          };

                          setItemOptions((prev) => ({
                            ...prev,
                            [item.type_of_product]: [
                              ...(prev[item.type_of_product] || []),
                              newOption,
                            ],
                          }));

                          try {
                            await axios.post(
                              "http://localhost/DeliveryTrackingSystem/save_product.php",
                              {
                                type_of_product: item.type_of_product,
                                description: newValue,
                                unit_cost: 0,
                              }
                            );
                          } catch (err) {
                            console.error("Error saving product item", err);
                          }

                          const e = {
                            target: { name: "description", value: newValue },
                          };
                          handleItemChange(index, e);
                        }}
                        placeholder={
                          item.type_of_product
                            ? `${item.type_of_product} Items`
                            : "Select Item"
                        }
                        isDisabled={!item.type_of_product}
                        isSearchable
                        styles={{
                          control: (provided, state) => ({
                            ...provided,
                            minHeight: "41px",
                            height: "41px",
                            backgroundColor: !item.type_of_product
                              ? "#f5f5f5"
                              : "white",
                            opacity: !item.type_of_product ? 0.6 : 1,
                            cursor: !item.type_of_product
                              ? "not-allowed"
                              : "default",
                          }),
                          valueContainer: (provided) => ({
                            ...provided,
                            height: "41px",
                            padding: "0 8px",
                          }),
                          input: (provided) => ({
                            ...provided,
                            margin: 0,
                            padding: 0,
                          }),
                          indicatorsContainer: (provided) => ({
                            ...provided,
                            height: "41px",
                          }),
                          placeholder: (provided) => ({
                            ...provided,
                            textTransform: "none",
                            color: "#b4b4b4",
                          }),
                        }}
                      />
                    </td>

                    <td>
                      <input
                        type="text"
                        name="unit_cost"
                        placeholder="₱0.00"
                        className="form-control"
                        value={orderItems[index].unit_cost}
                        onChange={(e) => {
                          const value = parseFloat(parsePeso(e.target.value));
                          handleUnitCostChange(index, {
                            target: { value: Math.max(0, value) },
                          });
                        }}
                        onBlur={() => handleUnitCostBlur(index)}
                        onFocus={() => handleUnitCostFocus(index)}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="total_cost"
                        placeholder="₱0.00"
                        className="form-control"
                        value={formatPeso(item.total_cost)}
                        readOnly
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

            <h4 className="mb-4">Payment Details</h4>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label d-block">Payment Method:</label>
                <Select
                  options={paymentOptions}
                  onChange={(selected) =>
                    setForm((prev) => ({
                      ...prev,
                      payment_method: selected?.value || "",
                    }))
                  }
                  value={
                    paymentOptions
                      .flatMap((opt) => (opt.options ? opt.options : opt))
                      .find((opt) => opt.value === form.payment_method) || null
                  }
                  placeholder="Select Payment Method"
                  isSearchable
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      minHeight: "41px",
                      height: "41px",
                    }),
                    valueContainer: (provided) => ({
                      ...provided,
                      height: "41px",
                      padding: "0 8px",
                    }),
                    input: (provided) => ({
                      ...provided,
                      margin: 0,
                      padding: 0,
                    }),
                    indicatorsContainer: (provided) => ({
                      ...provided,
                      height: "41px",
                    }),
                  }}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label d-block container-fluid">
                  Payment Option:
                </label>
                <div className="MOP d-flex justify-content-center gap-5 gap-md-5 container-fluid">
                  {["Full Payment", "Down Payment"].map((method) => (
                    <div
                      className="form-check d-flex align-items-center"
                      key={method}
                    >
                      <input
                        className="form-check-input me-2"
                        type="radio"
                        name="payment_option"
                        id={method.toLowerCase().replace(" ", "_")}
                        value={method}
                        checked={form.payment_option === method}
                        onChange={handleChange}
                        required
                      />
                      <label
                        className="form-check-label"
                        htmlFor={method.toLowerCase().replace(" ", "_")}
                        style={{ fontSize: "18px", fontWeight: "normal" }}
                      >
                        {method}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="full_payment" className="form-label">
                  Full Payment Amount:
                </label>
                <input
                  type="text"
                  name="full_payment"
                  placeholder="₱0.00"
                  value={formatPeso(form.full_payment)}
                  onChange={(e) => {
                    const parsedValue = parsePeso(e.target.value);
                    handleChange({
                      target: { name: "full_payment", value: parsedValue },
                    });
                  }}
                  disabled={form.payment_option !== "Full Payment"}
                  required={form.payment_option === "Full Payment"}
                  className="form-control"
                />
              </div>

              <div className="col-md-6">
                <label htmlFor="fpBillingDate" className="form-label">
                  Billing Date:
                </label>
                <input
                  style={{ color: "gray" }}
                  type="date"
                  className={`form-control ${
                    form.fp_collection_date ? "text-black" : "text-muted"
                  }`}
                  id="fpBillingDate"
                  name="fp_collection_date"
                  value={form.fp_collection_date || ""}
                  onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="down_payment" className="form-label">
                  Down Payment Amount:
                </label>
                <input
                  type="text"
                  name="down_payment"
                  placeholder="₱0.00"
                  value={form.down_payment}
                  onChange={(e) => {
                    const parsedValue = parsePeso(e.target.value);
                    handleChange({
                      target: { name: "down_payment", value: parsedValue },
                    });
                  }}
                  onFocus={handleDownPaymentFocus}
                  onBlur={handleDownPaymentBlur}
                  disabled={form.payment_option !== "Down Payment"}
                  required={form.payment_option === "Down Payment"}
                  className={`form-control ${dpError ? "is-invalid" : ""}`}
                />
                {dpError && <div className="invalid-feedback">{dpError}</div>}
              </div>

              <div className="col-md-6">
                <label htmlFor="dpBillingDate" className="form-label">
                  Payment Due:
                </label>
                <input
                  style={{ color: "gray" }}
                  type="date"
                  className={`form-control ${
                    form.dp_collection_date || "" ? "text-black" : "text-muted"
                  }`}
                  id="dpBillingDate"
                  name="dp_collection_date"
                  onChange={handleChange}
                  disabled={form.payment_option !== "Down Payment"}
                  required={form.payment_option === "Down Payment"}
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Balance:</label>
                <input
                  type="text"
                  name="balance"
                  placeholder="₱0.00"
                  value={
                    form.payment_option === "Down Payment"
                      ? formatPeso(form.balance)
                      : ""
                  }
                  onChange={(e) => {
                    const parsedValue = parsePeso(e.target.value);
                    handleChange({
                      target: { name: "balance", value: parsedValue },
                    });
                  }}
                  disabled={form.payment_option !== "Down Payment"}
                  required={form.payment_option === "Down Payment"}
                  className="form-control"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Total:</label>
                <input
                  type="text"
                  name="total"
                  placeholder="₱0.00"
                  value={formatPeso(form.total)}
                  onChange={(e) => {
                    const parsedValue = parsePeso(e.target.value);
                    handleChange({
                      target: { name: "total", value: parsedValue },
                    });
                  }}
                  disabled={!form.payment_option}
                  required={!!form.payment_option}
                  className="form-control"
                />
              </div>
            </div>
          </div>
        </form>
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
          <button
            type="submit"
            form="deliveryForm"
            className="add-btn bg-success"
          >
            Add
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AddDelivery;
