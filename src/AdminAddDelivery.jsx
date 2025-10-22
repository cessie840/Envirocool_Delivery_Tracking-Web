import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import axios from "axios";
import { FaRegTrashAlt, FaArrowLeft } from "react-icons/fa";
import { Button, Modal } from "react-bootstrap";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./loading-overlay.css";

const paymentOptions = [
  { label: "CASH", value: "Cash" },
  { label: "BANK TRANSFER", value: "Bank Transfer" },
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
          onMouseOut={(e) => {
            (e.currentTarget.style.backgroundColor = "#dc3545"),
              (e.currentTarget.style.color = "white");
          }}
        >
          DELETE
        </button>
      </div>
    </components.MenuList>
  );
};

const AddDelivery = () => {
  const proofFileRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [itemOptions, setItemOptions] = useState({});
  const [productOptions, setProductOptions] = useState([]);
  const [dpError, setDpError] = useState("");
  const [dpDateError, setDpDateError] = useState("");
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

  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [dateError, setDateError] = useState("");
  const [orderDateError, setOrderDateError] = useState("");
  const [nameError, setNameError] = useState("");
  const [fpBillingError, setFpBillingError] = useState("");

  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [receiptItems, setReceiptItems] = useState([]);
  const AUTO_DOWNLOAD_RECEIPT = false;

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
        "http://localhost/DeliveryTrackingSystem/delete_product.php",
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
    let value = e.target.value || "";

    value = value.replace(/\s+/g, "").trim();

    if (value === "") {
      setForm((prev) => ({ ...prev, customer_contact: "" }));
      setContactError("");
      return;
    }

    if (!/^\d+$/.test(value)) {
      setContactError("Contact number should contain numbers only.");
      return;
    }

    setForm((prev) => ({ ...prev, customer_contact: value }));

    if (!value.startsWith("09")) {
      setContactError("Contact number must start with '09'.");
    } else if (value.length > 11) {
      setContactError("Contact number cannot exceed 11 digits.");
    } else if (value.length < 11) {
      setContactError("Contact number must have 11 digits.");
    } else {
      setContactError("");
    }
  };

  const handleProofFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProofFile(file);
      setSelectedFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result);
      };
      reader.readAsDataURL(file);
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

    const downPayment = parseFloat(form.down_payment) || 0;
    const isDownPayment = form.payment_option === "Down Payment";

    setForm((prevForm) => ({
      ...prevForm,
      total: totalCost.toFixed(2),
      balance: isDownPayment
        ? (totalCost - downPayment).toFixed(2)
        : prevForm.balance || "",
    }));
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

  const getLocalDate = () => {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  };

  useEffect(() => {
    recalcTotal(orderItems);
  }, [form.payment_option]);

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

      updatedForm.total = totalCost.toFixed(2);

      if (value === "Full Payment") {
        updatedForm.balance = "";
        updatedForm.full_payment = totalCost.toFixed(2);
        updatedForm.down_payment = "";
        updatedForm.dp_collection_date = "";
      } else if (value === "Down Payment") {
        updatedForm.full_payment = "";
        updatedForm.fp_collection_date = "";
        updatedForm.balance = !isNaN(downPayment)
          ? (totalCost - downPayment).toFixed(2)
          : totalCost.toFixed(2);
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
        updatedForm.total = totalCost.toFixed(2);
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

  const handlePrintReceipt = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
    <html>
      <head>
        <title>Delivery Receipt</title>
        <style>
          @page { size: auto; margin: 0; } /* Auto size for height, no margins */
          body { 
            margin: 0; 
            padding: 0; 
            font-family: Arial, sans-serif; 
            font-size: 11px; /* Standard font size for body */
            line-height: 1.4; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            height: 100vh; /* Center vertically */
          }
          .receipt { 
            width: 80mm; /* Standard receipt width */
            margin: 0; 
            padding: 10px; 
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); /* Optional shadow for aesthetics */
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
          }
          th, td { 
            border: 1px solid #000; 
            padding: 2px; 
            text-align: left; 
            font-size: 10px; /* Smaller font size for table cells */
          }
          .text-center { text-align: center; }
          .fw-bold { font-weight: bold; }
          .text-end { text-align: right; }
        </style>
      </head>
      <body>
        <div class="receipt">${
          document.getElementById("receipt-section").innerHTML
        }</div>
      </body>
    </html>
  `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!/^09\d{9}$/.test(form.customer_contact)) {
      alert("Contact number must start with '09' and be exactly 11 digits.");
      setLoading(false);
      return;
    }

    if (!form.payment_method) {
      alert("Please select a payment method.");
      setLoading(false);
      return;
    }

    if (form.payment_method && !proofFile) {
      alert("Please upload proof of payment.");
      setLoading(false);
      return;
    }

    for (const [index, item] of orderItems.entries()) {
      const quantity = parseInt(item.quantity);
      const unitCost = parseFloat(parsePeso(item.unit_cost));
      const typeOfProduct = item.type_of_product?.trim();
      const description = item.description?.trim();

      if (!typeOfProduct) {
        alert(`Please select a type of product for item #${index + 1}`);
        setLoading(false);
        return;
      }

      if (!description) {
        alert(`Please select an item name for item #${index + 1}`);
        setLoading(false);
        return;
      }

      if (isNaN(quantity) || quantity < 1) {
        alert(`Quantity for item #${index + 1} must be at least 1`);
        setLoading(false);
        return;
      }

      if (isNaN(unitCost) || unitCost < 0) {
        alert(`Unit cost for item #${index + 1} must be a non-negative number`);
        setLoading(false);
        return;
      }
    }

    setForm((prev) => ({
      ...prev,
      down_payment: parsePeso(prev.down_payment) || 0,
    }));

    setLoading(false);
    setShowSummaryModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowSummaryModal(false);
    setLoading(true);

    const normalizedOrderItems = orderItems.map((item) => ({
      quantity: parseInt(item.quantity) || 0,
      type_of_product: item.type_of_product,
      description: item.description,
      unit_cost: parseFloat(parsePeso(item.unit_cost)) || 0,
      total_cost: parseFloat(item.total_cost) || 0,
    }));

    const formData = new FormData();
    formData.append("customer_name", form.customer_name);
    formData.append("house_no", form.house_no);
    formData.append("street_name", form.street_name);
    formData.append("barangay", form.barangay);
    formData.append("city", form.city);
    formData.append("customer_contact", form.customer_contact);
    formData.append("date_of_order", form.date_of_order);
    formData.append("target_date_delivery", form.target_date_delivery);
    formData.append("payment_method", form.payment_method);
    formData.append("payment_option", form.payment_option);
    formData.append(
      "full_payment",
      parseFloat(parsePeso(form.full_payment)) || 0
    );
    formData.append("fp_collection_date", form.fp_collection_date);
    formData.append(
      "down_payment",
      parseFloat(parsePeso(form.down_payment)) || 0
    );
    formData.append("dp_collection_date", form.dp_collection_date);
    formData.append("balance", parseFloat(parsePeso(form.balance)) || 0);
    formData.append("total", parseFloat(parsePeso(form.total)) || 0);
    formData.append(
      "customer_address",
      [
        form.house_no,
        form.street_name,
        form.barangay,
        form.city,
        "Laguna",
        "Philippines",
      ]
        .filter(Boolean)
        .join(", ")
    );
    formData.append("order_items", JSON.stringify(normalizedOrderItems));
    formData.append("proofOfPayment", proofFile);

    try {
      const res = await axios.post(
        "http://localhost/DeliveryTrackingSystem/add_delivery.php",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      alert("Delivery added successfully!");

      const newTransactionId = res.data.transaction_id || transactionId;

      const fetchAndStoreReceipt = async (id) => {
        try {
          const res = await axios.get(
            `http://localhost/DeliveryTrackingSystem/get_transaction_by_id.php?transaction_id=${id}`
          );
          console.log("Receipt data fetched:", res.data);

          const data = res.data;
          if (!data || !data.form) {
            console.error("Receipt fetch returned empty data", data);
            return false;
          }

          setReceiptData(data.form);
          setReceiptItems(
            Array.isArray(data.order_items) ? data.order_items : []
          );

          return true;
        } catch (err) {
          console.error("Error fetching receipt data", err);
          return false;
        }
      };

      if (AUTO_DOWNLOAD_RECEIPT) {
        const ok = await fetchAndStoreReceipt(newTransactionId);
        if (ok) {
          setShowReceiptModal(true);
          setTimeout(() => window.print(), 1000);
        } else {
          setShowReceiptModal(true);
        }
      } else {
        const ok = await fetchAndStoreReceipt(newTransactionId);
        setShowReceiptModal(true);
      }

      setForm({
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
      setOrderItems([
        {
          quantity: "",
          type_of_product: "",
          description: "",
          unit_cost: "",
          total_cost: "",
        },
      ]);

      setProofFile(null);
      setSelectedFileName("");
      if (proofFileRef.current) {
        proofFileRef.current.value = "";
      }

      fetchLatestIDs();
    } catch (error) {
      console.error("Error submitting form", error);
      alert("Error saving delivery.");
    } finally {
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
                className={`form-control ${nameError ? "is-invalid" : ""}`}
                id="customerName"
                name="customer_name"
                value={form.customer_name}
                placeholder="Client's Name"
                onChange={(e) => {
                  const value = e.target.value;

                  if (/^[A-Za-z-ñÑ\s]*$/.test(value)) {
                    setForm((prev) => ({ ...prev, customer_name: value }));
                    setNameError("");
                  } else {
                    setNameError(
                      "Name should only contain letters and spaces."
                    );
                  }
                }}
                required
              />
              {nameError && <div className="invalid-feedback">{nameError}</div>}
            </div>

            <div className="col-md-6">
              <label htmlFor="dateOfOrder" className="form-label">
                Date of Order:
              </label>
              <input
                type="date"
                className={`form-control ${
                  form.date_of_order ? "text-black" : "text-muted"
                } ${orderDateError ? "is-invalid" : ""}`}
                id="dateOfOrder"
                name="date_of_order"
                value={
                  form.date_of_order
                    ? new Date(form.date_of_order).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) => {
                  const selectedDate = new Date(e.target.value + "T00:00:00");
                  const today = new Date(getLocalDate() + "T00:00:00");
                  const day = selectedDate.getDay();

                  if (isNaN(selectedDate.getTime())) {
                    setOrderDateError("Please enter a valid date.");
                  } else if (day === 0 || day === 6) {
                    setOrderDateError(
                      "Weekends are not allowed. Please choose another day."
                    );
                    e.target.value = "";
                    setForm((prev) => ({ ...prev, date_of_order: "" }));
                    return;
                  } else if (selectedDate > today) {
                    setOrderDateError("Date of order cannot be in the future.");
                  } else {
                    setOrderDateError("");
                    handleChange(e);
                  }
                }}
                required
                max={getLocalDate()}
              />

              {orderDateError && (
                <div className="invalid-feedback">{orderDateError}</div>
              )}
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
                  placeholder="Village/Subdivision"
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
                inputMode="numeric"
                autoComplete="tel-national"
                pattern="\d*"
                className={`form-control ${contactError ? "is-invalid" : ""}`}
                id="contactNumber"
                name="customer_contact"
                value={form.customer_contact}
                placeholder="Client's Contact No."
                onChange={handleContactChange}
                maxLength={11}
                required
              />

              {contactError && (
                <div className="invalid-feedback">{contactError}</div>
              )}
            </div>
            <div className="col-md-6">
              <label htmlFor="targetDate" className="form-label">
                Date of Delivery:
              </label>
              <input
                type="date"
                id="targetDate"
                name="target_date_delivery"
                className={`form-control ${
                  form.target_date_delivery ? "text-black" : "text-muted"
                } ${dateError ? "is-invalid" : ""}`}
                value={form.target_date_delivery || ""}
                onChange={(e) => {
                  const selectedDate = new Date(e.target.value + "T00:00:00");
                  const today = new Date(getLocalDate() + "T00:00:00");
                  const day = selectedDate.getDay();

                  if (isNaN(selectedDate.getTime())) {
                    setDateError("Please enter a valid date.");
                  } else if (day === 0 || day === 6) {
                    setDateError(
                      "Weekends are not allowed. Please choose another day."
                    );
                    e.target.value = "";
                    setForm((prev) => ({ ...prev, target_date_delivery: "" }));
                    return;
                  } else if (selectedDate < today) {
                    setDateError("Date of delivery cannot be in the past.");
                  } else {
                    setDateError("");
                    handleChange(e);
                  }
                }}
                required
                min={getLocalDate()}
              />
              {dateError && <div className="invalid-feedback">{dateError}</div>}
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
                        type="text"
                        name="quantity"
                        placeholder="0"
                        className="form-control"
                        value={item.quantity}
                        onChange={(e) => {
                          const value = e.target.value;

                          if (/^\d*$/.test(value)) {
                            handleItemChange(index, {
                              target: { name: "quantity", value },
                            });
                          }
                        }}
                        onKeyDown={(e) => {
                          if (
                            ["e", "E", "+", "-", ".", " "].includes(e.key) ||
                            (isNaN(e.key) &&
                              e.key !== "Backspace" &&
                              e.key !== "Delete" &&
                              e.key !== "ArrowLeft" &&
                              e.key !== "ArrowRight" &&
                              e.key !== "Tab")
                          ) {
                            e.preventDefault();
                          }
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
                          Edit
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
                                "http://localhost/DeliveryTrackingSystem/update_product.php",
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
                          const value = e.target.value.replace(/[^0-9.]/g, "");
                          handleUnitCostChange(index, {
                            target: { value },
                          });
                        }}
                        onKeyDown={(e) => {
                          if (
                            ["e", "E", "+", "-", " "].includes(e.key) ||
                            (isNaN(e.key) &&
                              e.key !== "Backspace" &&
                              e.key !== "Delete" &&
                              e.key !== ".")
                          ) {
                            e.preventDefault();
                          }
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
              <tfoot>
                <tr className="fw-bold">
                  <td colSpan="4" className="text-end">
                    TOTAL:
                  </td>
                  <td className="text-end">
                    {form.total !== "" && form.total !== null
                      ? formatPeso(form.total)
                      : "₱0.00"}
                  </td>
                  {orderItems.length > 1 && (
                    <td style={{ border: "none" }}></td>
                  )}
                </tr>
              </tfoot>
            </table>

            <div className="d-flex justify-content-end mt-2">
              <button
                type="button"
                className="btn add-item rounded-1"
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
                        onChange={(e) => {
                          handleChange(e);
                          if (e.target.name === "payment_option") {
                            setForm((prev) => ({
                              ...prev,
                              payment_option: e.target.value,
                              dp_collection_date: prev.dp_collection_date || "",
                              down_payment: prev.down_payment || "",
                            }));
                          }
                        }}
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
                <label htmlFor="fpBillingDate" className="form-label">
                  Billing Date:
                </label>
                <input
                  style={{ color: "gray" }}
                  type="date"
                  className={`form-control ${
                    form.fp_collection_date ? "text-black" : "text-muted"
                  } ${fpBillingError ? "is-invalid" : ""}`}
                  id="fpBillingDate"
                  name="fp_collection_date"
                  value={
                    form.fp_collection_date
                      ? new Date(form.fp_collection_date)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  onChange={(e) => {
                    const selectedDate = new Date(e.target.value + "T00:00:00");
                    const today = new Date(getLocalDate() + "T00:00:00");
                    const day = selectedDate.getDay();

                    if (isNaN(selectedDate.getTime())) {
                      setFpBillingError("Please enter a valid date.");
                    } else if (day === 0 || day === 6) {
                      setFpBillingError(
                        "Weekends are not allowed. Please choose another day."
                      );
                      e.target.value = "";
                      setForm((prev) => ({ ...prev, fp_collection_date: "" }));
                      return;
                    } else if (selectedDate > today) {
                      setFpBillingError(
                        "Billing date cannot be in the future."
                      );
                    } else {
                      setFpBillingError("");
                      handleChange(e);
                    }
                  }}
                  required
                  max={getLocalDate()}
                />
                {fpBillingError && (
                  <div className="invalid-feedback">{fpBillingError}</div>
                )}
              </div>

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
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="dpBillingDate" className="form-label">
                  Payment Due:
                </label>
                <input
                  type="date"
                  id="dpBillingDate"
                  name="dp_collection_date"
                  value={form.dp_collection_date || ""}
                  onChange={(e) => {
                    const selectedDate = new Date(e.target.value + "T00:00:00");
                    const today = new Date(getLocalDate() + "T00:00:00");
                    const day = selectedDate.getDay();

                    if (isNaN(selectedDate.getTime())) {
                      setDpDateError("Please enter a valid date.");
                      e.target.value = "";
                      setForm((prev) => ({ ...prev, dp_collection_date: "" }));
                    } else if (day === 0 || day === 6) {
                      setDpDateError(
                        "Weekends are not allowed. Please choose another day."
                      );
                      e.target.value = "";
                      setForm((prev) => ({ ...prev, dp_collection_date: "" }));
                      return;
                    } else if (selectedDate < today) {
                      setDpDateError("Payment due date cannot be in the past.");
                      e.target.value = "";
                      setForm((prev) => ({ ...prev, dp_collection_date: "" }));
                    } else {
                      setDpDateError("");
                      handleChange(e);
                    }
                  }}
                  disabled={form.payment_option !== "Down Payment"}
                  required={form.payment_option === "Down Payment"}
                  min={getLocalDate()}
                  className={`form-control ${
                    form.payment_option !== "Down Payment"
                      ? "text-muted"
                      : form.dp_collection_date
                      ? "text-black"
                      : "text-muted"
                  } ${dpDateError ? "is-invalid" : ""}`}
                  style={{
                    backgroundColor:
                      form.payment_option === "Down Payment"
                        ? "white"
                        : "#E9ECEF",
                    cursor:
                      form.payment_option === "Down Payment"
                        ? "pointer"
                        : "not-allowed",
                  }}
                />
                {dpDateError && (
                  <div className="invalid-feedback d-block">{dpDateError}</div>
                )}
              </div>

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

              <div className="col-md-6"></div>
            </div>

            <h4 className="mt-5">PROOF OF PAYMENT</h4>
            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="proofOfPayment" className="form-label">
                  Upload Proof of Payment:
                </label>
                <div className="d-flex align-items-center">
                  <input
                    type="file"
                    className="form-control"
                    id="proofOfPayment"
                    name="proofOfPayment"
                    accept="image/*"
                    onChange={handleProofFileChange}
                    ref={proofFileRef}
                  />

                  {selectedFileName && (
                    <button
                      type="button"
                      className="btn add-item px-3 py-1 btn-sm ms-2 fs-6"
                      onClick={() => setShowPreviewModal(true)}
                    >
                      View
                    </button>
                  )}
                </div>
              </div>
            </div>

            <Modal
              show={showPreviewModal}
              onHide={() => setShowPreviewModal(false)}
              centered
              size="lg"
            >
              <Modal.Header
                closeButton
                className="bg-primary text-white bg-opacity-75"
              >
                <Modal.Title>Proof of Payment Preview</Modal.Title>
              </Modal.Header>
              <Modal.Body className="text-center bg-light">
                {proofPreview &&
                  typeof proofPreview === "string" &&
                  proofPreview.startsWith("data:") && (
                    <img
                      src={proofPreview}
                      alt="Proof of Payment"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "700px",
                        objectFit: "contain",
                      }}
                      className="border border-secondary border-1"
                    />
                  )}
              </Modal.Body>
            </Modal>
            <Modal
              show={showSummaryModal}
              onHide={() => setShowSummaryModal(false)}
              centered
              size="lg"
            >
              <Modal.Header closeButton className="bg-success text-white">
                <Modal.Title>Transaction Summary</Modal.Title>
              </Modal.Header>
              <Modal.Body className="bg-white">
                <div className="summary-content">
                  <p>
                    <strong>Transaction No.:</strong> {transactionId}
                  </p>
                  <p className="mb-3">
                    <strong>P.O. No.:</strong> {poId}
                  </p>

                  <p>
                    <strong>Customer Name:</strong> {form.customer_name}
                  </p>
                  <p>
                    <strong>Address: </strong>
                    {[
                      form.house_no,
                      form.street_name,
                      form.barangay,
                      form.city,
                      "Laguna",
                      "Philippines",
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p>
                    <strong>Contact:</strong> {form.customer_contact}
                  </p>
                  <p>
                    <strong>Date of Order:</strong> {form.date_of_order}
                  </p>
                  <p>
                    <strong>Delivery Date:</strong> {form.target_date_delivery}
                  </p>
                  <p>
                    <strong>Payment Method:</strong> {form.payment_method}
                  </p>
                  <p>
                    <strong>Payment Option:</strong> {form.payment_option}
                  </p>
                  {form.payment_option === "Full Payment" && (
                    <>
                      <p>
                        <strong>Full Payment: </strong>
                        {formatPeso(form.full_payment)}
                      </p>
                      <p>
                        <strong>Billing Date: </strong>{" "}
                        {form.fp_collection_date}
                      </p>
                    </>
                  )}
                  {form.payment_option === "Down Payment" && (
                    <>
                      <p>
                        <strong>Down Payment:</strong>{" "}
                        {formatPeso(form.down_payment)}
                      </p>
                      <p>
                        <strong>Payment Due:</strong> {form.dp_collection_date}
                      </p>
                      <p>
                        <strong>Balance:</strong> {formatPeso(form.balance)}
                      </p>
                    </>
                  )}

                  <strong className="fs-5">Order Items:</strong>
                  <table className="table table-bordered table-sm mt-2">
                    <thead className="table-success text-center align-middle">
                      <tr>
                        <th>Qty</th>
                        <th>Item</th>
                        <th>Unit Cost</th>
                        <th>Total Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((item, index) => (
                        <tr key={index}>
                          <td className="text-center">{item.quantity}</td>
                          <td>
                            {item.type_of_product} - {item.description}
                          </td>
                          <td className="text-end">
                            {formatPeso(
                              parseFloat(parsePeso(item.unit_cost)) || 0
                            )}
                          </td>
                          <td className="text-end">
                            {formatPeso(item.total_cost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" className="text-end fw-bold">
                          TOTAL:
                        </td>
                        <td className="text-end fw-bold">
                          {formatPeso(form.total)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                  {proofFile ? (
                    <div className="mt-3">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => setShowImageViewer(true)}
                      >
                        View Proof of Payment
                      </Button>
                    </div>
                  ) : (
                    <p>
                      <strong>Proof of Payment:</strong> Not uploaded
                    </p>
                  )}

                  {showImageViewer && proofFile && (
                    <div className="mt-3 border p-2 bg-success bg-opacity-10 rounded">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="text-center w-100 fs-5">
                          Proof of Payment Preview
                        </h6>
                        <Button
                          variant="close"
                          onClick={() => setShowImageViewer(false)}
                        />
                      </div>
                      <div className="text-center">
                        {proofPreview && (
                          <img
                            src={proofPreview}
                            alt="Proof of Payment"
                            style={{
                              maxWidth: "100%",
                              maxHeight: "400px",
                              objectFit: "contain",
                              border: "1px solid gray",
                              borderRadius: "5px",
                            }}
                            className="img-fluid"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  className="cancel-btn px-3 py-2 fs-6 rounded-1"
                  onClick={() => setShowSummaryModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="add-btn px-3 py-2 fs-6 rounded-1"
                  onClick={handleConfirmSubmit}
                >
                  Confirm
                </Button>
              </Modal.Footer>
            </Modal>
            <Modal
              show={showReceiptModal}
              onHide={() => setShowReceiptModal(false)}
              centered
              size="lg"
            >
              <Modal.Header
                closeButton
                className="bg-light text-black no-print"
              >
                <Modal.Title></Modal.Title>
              </Modal.Header>

              <Modal.Body
                id="receipt-section"
                className="bg-white text-black p-4"
              >
                <div className="text-center mb-4 border-bottom pb-2">
                  <h3 className="fw-bold text-success mb-0">ENVIROCOOL</h3>
                  <p className="mb-0">Official Delivery Receipt</p>
                  <small>Date Printed: {new Date().toLocaleString()}</small>
                </div>

                {/* Customer and order details */}
                <div className="mb-3">
                  <p>
                    <b>Customer Name:</b> {receiptData?.customer_name || ""}
                  </p>
                  <p>
                    <b>Address:</b>{" "}
                    {[
                      receiptData?.house_no,
                      receiptData?.street_name,
                      receiptData?.barangay,
                      receiptData?.city,
                      "Laguna",
                      "Philippines",
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p>
                    <b>Contact:</b> {receiptData?.customer_contact || ""}
                  </p>
                  <p>
                    <b>Date of Order:</b> {receiptData?.date_of_order || ""}
                  </p>
                  <p>
                    <b>Delivery Date:</b>{" "}
                    {receiptData?.target_date_delivery || ""}
                  </p>
                </div>

                {/* Payment details */}
                <div className="mb-3">
                  <p>
                    <b>Payment Method:</b>{" "}
                    {receiptData?.mode_of_payment ||
                      receiptData?.payment_method ||
                      ""}
                  </p>
                  <p>
                    <b>Payment Option:</b> {receiptData?.payment_option || ""}
                  </p>

                  {receiptData?.payment_option === "Down Payment" && (
                    <>
                      <p>
                        <b>Down Payment:</b>{" "}
                        {formatPeso(parseFloat(receiptData?.down_payment || 0))}
                      </p>
                      <p>
                        <b>Payment Due:</b>{" "}
                        {receiptData?.dbilling_date ||
                          receiptData?.dp_collection_date ||
                          ""}
                      </p>
                      <p>
                        <b>Balance:</b>{" "}
                        {formatPeso(parseFloat(receiptData?.balance || 0))}
                      </p>
                    </>
                  )}

                  {receiptData?.payment_option === "Full Payment" && (
                    <>
                      <p>
                        <b>Full Payment:</b>{" "}
                        {formatPeso(parseFloat(receiptData?.full_payment || 0))}
                      </p>
                      <p>
                        <b>Billing Date:</b>{" "}
                        {receiptData?.fbilling_date ||
                          receiptData?.fp_collection_date ||
                          ""}
                      </p>
                    </>
                  )}
                </div>

                {/* Order items */}
                <b className="mt-4 mb-2 fw-bold fs-5">Order Items</b>
                <table className="table table-bordered table-sm">
                  <thead className="table-light text-center">
                    <tr>
                      <th>Qty</th>
                      <th>Item</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptItems.map((item, i) => (
                      <tr key={i}>
                        <td className="text-center">{item.quantity}</td>
                        <td>
                          {item.type_of_product} - {item.description}
                        </td>
                        <td className="text-end">
                          {formatPeso(parseFloat(item.unit_cost || 0))}
                        </td>
                        <td className="text-end">
                          {formatPeso(
                            parseFloat(
                              item.total_cost ||
                                item.quantity * item.unit_cost ||
                                0
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="text-end fw-bold">
                        TOTAL:
                      </td>
                      <td className="text-end fw-bold">
                        {formatPeso(parseFloat(receiptData?.total || 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Signature Section */}
                <div className="signature-section mt-4">
                  <div className="row">
                    <div className="col-6 text-center">
                      <p>________________________</p>
                      <small>Prepared By</small>
                    </div>
                    <div className="col-6 text-center">
                      <p>________________________</p>
                      <small>Received By</small>
                    </div>
                  </div>
                </div>
              </Modal.Body>

              <Modal.Footer className="no-print bg-light">
                <Button
                  variant="secondary"
                  onClick={() => setShowReceiptModal(false)}
                >
                  Close
                </Button>
                <Button variant="success" onClick={handlePrintReceipt}>
                  Print / Download
                </Button>
                {/* <Button variant="primary" onClick={handleDownloadPDF}>
      Download PDF
    </Button> */}
              </Modal.Footer>
            </Modal>
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
                className="cancel-btn py-2 px-3 fs-6 shadow"
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
            <button
              type="submit"
              form="deliveryForm"
              className="add-btn shadow"
            >
              Add
            </button>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AddDelivery;
