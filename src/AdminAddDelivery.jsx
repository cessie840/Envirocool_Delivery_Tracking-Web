import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import axios from "axios";
import { FaRegTrashAlt, FaArrowLeft } from "react-icons/fa";
import { Button, Modal } from "react-bootstrap";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import "./loading-overlay.css";


const paymentOptions = [
  { label: "CASH", value: "Cash" },
  { label: "BANK TRANSFER" ,value: "Bank Transfer"}
    
];

import { components } from "react-select";

const CustomMenuList = (props) => {
  const { children, selectProps } = props;

  return (
    <components.MenuList {...props}>
      {children}

      <div
        className="d-flex justify-content-around mt-2 py-2 px-2  border-top"
        style={{ gap: "8px" }}
      >
        <button
          type="button"
          className="btn btn-success btn-sm"
          style={{
            flex: 1,
            transition: "background-color 0.2s",
          }}
          onClick={() => selectProps.onEdit?.()}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "white";
            e.currentTarget.style.color = "#135d2aff";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "#198754";
            e.currentTarget.style.color = "white";
          }}
        >
          EDIT
        </button>

        <button
          type="button"
          className="btn btn-danger btn-sm"
          style={{
            flex: 1,
            transition: "background-color 0.2s",
          }}
          onClick={() => selectProps.onDelete?.()}
          onMouseOver={(e) => {
            (e.currentTarget.style.color = "#a71d2a"),
              (e.currentTarget.style.backgroundColor = "white");
          }}
          onMouseOut={(e) =>
            {
              (e.currentTarget.style.backgroundColor = "#dc3545"),
              (e.currentTarget.style.color = "white")
            ; 
            }
          }
        >
          DELETE
        </button>
      </div>
    </components.MenuList>
  );
};






const AddDelivery = () => {
  const [products, setProducts] = useState([]);
  const [itemOptions, setItemOptions] = useState({});
  const [productOptions, setProductOptions] = useState([]);
  const [dpError, setDpError] = useState("");
  const [contactError, setContactError] = useState("");

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);


  const [transactionId, setTransactionId] = useState("Loading...");
  const [poId, setPoId] = useState("Loading...");
  const [showCancelModal, setShowCancelModal] = useState(false);

  
  const [editModal, setEditModal] = useState({
    show: false,
    type: "", 
    currentValue: "",
    index: null,
    typeOfProduct: "", 
  });
  const [newValue, setNewValue] = useState("");

const [form, setForm] = useState({
  customer_name: "",
  house_no: "",
  street_name: "",
  barangay: "",
  city: "",
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

 
const [lagunaData, setLagunaData] = useState({});
const [cityOptions, setCityOptions] = useState([]);
const [barangayOptions, setBarangayOptions] = useState([]);



useEffect(() => {
  const fetchLagunaData = async () => {
    try {
      const res = await axios.get(
        "http://localhost/DeliveryTrackingSystem/get_barangay.php"
      );
      setLagunaData(res.data);

      // Convert keys of fetched object to city dropdown options
      const cities = Object.keys(res.data).map((city) => ({
        label: city,
        value: city,
      }));
      setCityOptions(cities);
    } catch (err) {
      console.error("Error fetching Laguna data", err);
    }
  };

  fetchLagunaData();
}, []);

const handleCityChange = (selected) => {
  const city = selected.value;
  setForm((prev) => ({ ...prev, city, barangay: "" }));

  const barangays = lagunaData[city] || [];
  setBarangayOptions(barangays.map((b) => ({ label: b, value: b })));
};

const handleBarangayChange = (selected) => {
  setForm((prev) => ({ ...prev, barangay: selected.value }));
};

  const handleEditClick = (type, currentValue, index, typeOfProduct = "") => {
    setEditModal({ show: true, type, currentValue, index, typeOfProduct });
    setNewValue(currentValue);
  };

  const handleDeleteClick = async (type, value, index, typeOfProduct = "") => {
    if (!window.confirm(`Are you sure you want to delete "${value}"?`)) return;

    try {
      await axios.post(
        "http:/localhost//DeliveryTrackingSystem/delete_product.php",
        {
          type_of_product: typeOfProduct || value,
          description: type === "item" ? value : "",
        }
      );

      if (type === "product") {
        setProductOptions((prev) => prev.filter((opt) => opt.value !== value));
        setOrderItems((prev) =>
          prev.map((item) =>
            item.type_of_product === value
              ? { ...item, type_of_product: "" }
              : item
          )
        );
      } else {
        setItemOptions((prev) => ({
          ...prev,
          [typeOfProduct]: prev[typeOfProduct].filter(
            (opt) => opt.value !== value
          ),
        }));
        setOrderItems((prev) =>
          prev.map((item) =>
            item.type_of_product === typeOfProduct && item.description === value
              ? { ...item, description: "" }
              : item
          )
        );
      }

      alert("Deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Error deleting item");
    }
  };

  const handleContactChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, customer_contact: value }));

  
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
          "http:/localhost//DeliveryTrackingSystem/get_products.php"
        );
        setProductOptions(res.data);

        const itemsRes = await axios.get(
          "http:/localhost//DeliveryTrackingSystem/get_items.php"
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
        "http:/localhost//DeliveryTrackingSystem/get_latest_ids.php"
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
      setLoading(true);


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
     customer_address: `${form.house_no}, ${form.street_name},${form.barangay},${form.city}, Laguna,Philippines  `,
     down_payment: parseFloat(parsePeso(form.down_payment)) || 0,
     full_payment: parseFloat(parsePeso(form.full_payment)) || 0,
     total: parseFloat(parsePeso(form.total)) || 0,
     order_items: normalizedOrderItems,
   };

    try {
  const res = await axios.post(
    "http:/localhost//DeliveryTrackingSystem/add_delivery.php",
    dataToSend,
    { headers: { "Content-Type": "application/json" } }
  );
    setLoading(true);
  alert("Delivery added successfully!");

 
  

      setForm({
        customer_name: "",
        customer_address: "",
        customer_contact: "",
        target_date_delivery: "",
        date_of_order: "",
        date_of_deliver:"",
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
    finally {
    setLoading(false); 
  }
  };
  


  return (
    <AdminLayout title="Add Delivery" showSearch={false}>
      <div className="d-flex justify-content-start mt-4 ms-4">
        <button
          className="back-btn btn-success d-flex align-items-center gap-2 rounded-2"
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
                value={
                  form.date_of_order
                    ? new Date(form.date_of_order).toISOString().slice(0, 10)
                    : ""
                }
                onChange={handleChange}
                required
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Customer Address:</label>
            <div className="row g-2">
              <div className="col-md-3">
                <Select
                  options={cityOptions}
                  value={
                    form.city ? { label: form.city, value: form.city } : null
                  }
                  onChange={handleCityChange}
                  placeholder="Select City"
                  classNamePrefix="react-select"
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
                  }}
                />
              </div>

              <div className="col-md-3">
                <Select
                  options={barangayOptions}
                  value={
                    form.barangay
                      ? { label: form.barangay, value: form.barangay }
                      : null
                  }
                  onChange={handleBarangayChange}
                  placeholder="Select Barangay"
                  isDisabled={!form.city}
                  classNamePrefix="react-select"
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
                  }}
                />
              </div>

              <div className="col-md-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="House No./Street Name"
                  name="house_no"
                  value={form.house_no ?? ""}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Subdivision/Village"
                  name="street_name"
                  value={form.street_name ?? ""}
                  onChange={handleChange}
                />
              </div>
            </div>
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
                        options={[...productOptions]}
                        value={
                          productOptions.find(
                            (opt) => opt.value === item.type_of_product
                          ) || null
                        }
                        onChange={(selected) => {
                          if (selected?.value === "__actions__") return;
                          handleItemChange(index, {
                            target: {
                              name: "type_of_product",
                              value: selected?.value || "",
                            },
                          });
                        }}
                        onCreateOption={async (newValue) => {
                          const newOption = {
                            label: newValue,
                            value: newValue,
                          };
                          setProductOptions((prev) => [...prev, newOption]);
                          handleItemChange(index, {
                            target: {
                              name: "type_of_product",
                              value: newValue,
                            },
                          });

                          try {
                            await axios.post(
                              "http:/localhost//DeliveryTrackingSystem/save_product.php",
                              {
                                type_of_product: newValue,
                                description: "",
                                unit_cost: 0,
                              }
                            );
                          } catch (err) {
                            console.error("Error saving product type", err);
                          }
                        }}
                        placeholder="Select type"
                        isSearchable
                        components={{ MenuList: CustomMenuList }}
                        onEdit={() =>
                          handleEditClick(
                            "product",
                            item.type_of_product,
                            index
                          )
                        }
                        onDelete={() =>
                          handleDeleteClick(
                            "product",
                            item.type_of_product,
                            index
                          )
                        }
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

                          option: (provided, state) => ({
                            ...provided,

                            border: "7px solid white",
                            backgroundColor: state.isSelected
                              ? "#84cf95ff"
                              : state.isFocused
                              ? "#bbd2c1ff"
                              : "#e6f4ea",
                            color: state.isSelected ? "#fff" : "#000",
                            cursor: "pointer",
                          }),
                        }}
                      />
                    </td>

                    <td>
                      <CreatableSelect
                        options={
                          item.type_of_product
                            ? itemOptions[item.type_of_product]?.filter(
                                (opt) => opt.value && opt.value.trim() !== ""
                              ) || []
                            : []
                        }
                        value={
                          item.description
                            ? itemOptions[item.type_of_product]?.find(
                                (opt) => opt.value === item.description
                              ) || null
                            : null
                        }
                        onChange={(selected) => {
                          if (!selected) return;
                          handleItemChange(index, {
                            target: {
                              name: "description",
                              value: selected.value,
                            },
                          });
                        }}
                        onCreateOption={async (newValue) => {
                          if (!newValue.trim()) return;
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
                          handleItemChange(index, {
                            target: { name: "description", value: newValue },
                          });

                          try {
                            await axios.post(
                              "http:/localhost//DeliveryTrackingSystem/save_product.php",
                              {
                                type_of_product: item.type_of_product,
                                description: newValue,
                                unit_cost: 0,
                              }
                            );
                          } catch (err) {
                            console.error("Error saving product item", err);
                          }
                        }}
                        placeholder={
                          item.type_of_product
                            ? itemOptions[item.type_of_product]?.length > 0
                              ? `${item.type_of_product} Items`
                              : "No options"
                            : "Select Item"
                        }
                        isDisabled={!item.type_of_product}
                        isSearchable
                        components={{ MenuList: CustomMenuList }}
                        onEdit={() =>
                          handleEditClick(
                            "item",
                            item.description,
                            index,
                            item.type_of_product
                          )
                        }
                        onDelete={() =>
                          handleDeleteClick(
                            "item",
                            item.description,
                            index,
                            item.type_of_product
                          )
                        }
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
                          option: (provided, state) => ({
                            ...provided,
                            border: "7px solid white",
                            backgroundColor: state.isSelected
                              ? "#84cf95ff"
                              : state.isFocused
                              ? "#bbd2c1ff"
                              : "#e6f4ea",
                            color: state.isSelected ? "#fff" : "#000",
                            cursor: "pointer",
                          }),
                        }}
                      />
                    </td>

                    <Modal
                      show={editModal.show}
                      onHide={() => setEditModal({ ...editModal, show: false })}
                      centered
                    >
                      <Modal.Header closeButton>
                        <Modal.Title>
                          Edit{" "}
                          {editModal.type === "product"
                            ? "Product Type"
                            : "Item"}
                        </Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        <input
                          type="text"
                          className="form-control"
                          value={newValue}
                          onChange={(e) => setNewValue(e.target.value)}
                        />
                      </Modal.Body>
                      <Modal.Footer>
                        <Button
                          className="hover-cancel-btn"
                          variant="secondary"
                          onClick={() =>
                            setEditModal({ ...editModal, show: false })
                          }
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="success"
                          onClick={async () => {
                            try {
                              await axios.post(
                                "http:/localhost//DeliveryTrackingSystem/update_product.php",
                                {
                                  type_of_product_current:
                                    editModal.type === "product"
                                      ? editModal.currentValue
                                      : editModal.typeOfProduct,
                                  type_of_product_new:
                                    editModal.type === "product"
                                      ? newValue
                                      : editModal.typeOfProduct,
                                  description_current:
                                    editModal.type === "item"
                                      ? editModal.currentValue
                                      : "",
                                  description_new:
                                    editModal.type === "item" ? newValue : "",
                                }
                              );

                              if (editModal.type === "product") {
                                setProductOptions((prev) =>
                                  prev.map((opt) =>
                                    opt.value === editModal.currentValue
                                      ? { label: newValue, value: newValue }
                                      : opt
                                  )
                                );

                                setOrderItems((prev) =>
                                  prev.map((item) =>
                                    item.type_of_product ===
                                    editModal.currentValue
                                      ? { ...item, type_of_product: newValue }
                                      : item
                                  )
                                );

                                setItemOptions((prev) => {
                                  const updated = { ...prev };
                                  if (updated[editModal.currentValue]) {
                                    updated[newValue] = [
                                      ...updated[editModal.currentValue],
                                    ];
                                    delete updated[editModal.currentValue];
                                  }
                                  return updated;
                                });
                              }

                              setEditModal({ ...editModal, show: false });
                              alert("Updated successfully!");
                            } catch (err) {
                              console.error(err);
                              alert("Error updating!");
                            }
                          }}
                        >
                          Save Changes
                        </Button>
                      </Modal.Footer>
                    </Modal>

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
        <div className="btn-group mx-3 mt-4 gap-4">
          <button
            type="button"
            className="cancel-btn px-3 py-1 bg-danger"
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
                className="close-btn py-2 fs-6"
                variant="secondary"
                onClick={() => setShowCancelModal(false)}
              >
                No
              </Button>
              <Button
                className="cancel-btn py-2 px-3 fs-6"
                variant="danger"
                onClick={handleConfirmCancel}
              >
                Yes, Cancel
              </Button>
            </Modal.Footer>
          </Modal>
          {loading ? (
            <div className="loading-overlay">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <button type="submit" form="deliveryForm" className="add-btn">
              Add
            </button>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AddDelivery;
