import React, { useState, useRef, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import Swal from "sweetalert2";
import { ToastHelper } from "./helpers/ToastHelper";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const UpdateOrderModal = ({
  show,
  handleClose,
  onSuccess,
  formData,
  setFormData,
}) => {
  const [proofFiles, setProofFiles] = useState([]);
  const [selectedFileNames, setSelectedFileNames] = useState([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [payments, setPayments] = useState(formData.payments || []);
  const [displayPayment, setDisplayPayment] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [dateError, setDateError] = useState("");
  const proofFileRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showReceiptModal, setShowReceiptModal] = useState(false); 
  const [receiptData, setReceiptData] = useState({}); 

  const handleOpenPreviewModal = () => {
    setCurrentIndex(0);
    setShowPreviewModal(true);
  };

  const [maxPaymentDate, setMaxPaymentDate] = useState("");

  useEffect(() => {
    if (show) {
      setFormData((prev) => ({
        ...prev,
        full_payment: "",
        fbilling_date: "",
      }));
      setPayments(formData.payments || []);
      setDisplayPayment("");
      setPaymentError("");
      setDateError("");
      setProofFiles([]);
      setSelectedFileNames([]);
    }
    if (formData.dbilling_date) {
      const [mm, dd, yyyy] = formData.dbilling_date.split("/");
      if (mm && dd && yyyy) setMaxPaymentDate(`${yyyy}-${mm}-${dd}`);
      else setMaxPaymentDate("");
    }
  }, [show, formData.dbilling_date]);

  const handleProofFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) =>
      ["image/jpeg", "image/png"].includes(file.type)
    );

    if (validFiles.length !== files.length) {
      Swal.fire({
        icon: "error",
        title: "Invalid File Type",
        text: "Only JPEG and PNG images are allowed.",
      });
      return;
    }

    setProofFiles(validFiles);
    setSelectedFileNames(validFiles.map((f) => f.name));
  };

  const getRemainingBeforeAdditional = () => {
    const total = parseFloat(formData.total || 0);
    const downPayment = parseFloat(formData.down_payment || 0);
    const totalPayments = payments.reduce(
      (sum, p) => sum + parseFloat(p.amount || 0),
      0
    );
    const remaining = total - (downPayment + totalPayments);
    return Math.max(0, remaining);
  };

  const remainingAfterCurrentPayment = () => {
    const total = parseFloat(formData.total || 0);
    const down = parseFloat(formData.down_payment || 0);
    const paid = payments.reduce(
      (sum, p) => sum + parseFloat(p.amount || 0),
      0
    );
    const current = parseFloat(formData.full_payment || 0);
    const remaining = total - (down + paid + (isNaN(current) ? 0 : current));
    return Math.max(0, remaining);
  };

  const isWeekend = (dateString) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const day = d.getDay();
    return day === 0 || day === 6;
  };

  const handleFullPaymentChange = (e) => {
    setPaymentError("");
    let raw = e.target.value.replace(/[^\d.]/g, "");
    if (raw.split(".").length > 2) return;
    if (raw && !/^\d*\.?\d{0,2}$/.test(raw)) return;

    const typedNum = parseFloat(raw || 0);
    const remainingBefore = getRemainingBeforeAdditional();

    if (typedNum > remainingBefore) {
      setPaymentError("Payment cannot exceed remaining balance.");
      setDisplayPayment("");
      setFormData({ ...formData, full_payment: "" });
      return;
    }

    const formatted = raw
      ? "₱" +
      parseFloat(raw).toLocaleString("en-PH", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })
      : "";

    setDisplayPayment(formatted);
    setFormData({ ...formData, full_payment: raw });
  };

  const handleFullPaymentBlur = () => {
    const val = formData.full_payment;
    if (!val) {
      setDisplayPayment("");
      return;
    }

    let num = parseFloat(val);
    if (isNaN(num)) num = 0;

    const remainingBefore = getRemainingBeforeAdditional();
    if (num > remainingBefore) {
      setPaymentError("Payment cannot exceed remaining balance.");
      setDisplayPayment("");
      setFormData({ ...formData, full_payment: "" });
      return;
    }

    const formatted =
      "₱" +
      num.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    setDisplayPayment(formatted);
    setFormData({ ...formData, full_payment: num.toFixed(2) });
  };

  const handleDateChange = (e) => {
    const picked = e.target.value;
    setDateError("");

    if (!picked) {
      setFormData({ ...formData, fbilling_date: "" });
      return;
    }

    const pickedDate = new Date(picked);
    const dueDate = new Date(formData.dbilling_date);

    if (isWeekend(picked)) {
      setDateError("Weekends are not allowed for payment date.");
      setFormData({ ...formData, fbilling_date: "" });
      return;
    }

    const toYMD = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    if (toYMD(pickedDate) > toYMD(dueDate)) {
      setDateError("Date cannot exceed payment due date.");
      setFormData({ ...formData, fbilling_date: "" });
      return;
    }

    setFormData({ ...formData, fbilling_date: picked });
  };

  const handleSaveChanges = async () => {
    const remainingBefore = getRemainingBeforeAdditional();
    const amount = parseFloat(formData.full_payment || 0);
    const paymentDate = formData.fbilling_date;

    let hasError = false;

    if (!amount || amount <= 0) {
      setPaymentError("Enter a valid payment amount.");
      hasError = true;
    }

    if (amount > remainingBefore) {
      setPaymentError("Payment cannot exceed remaining balance.");
      setDisplayPayment("");
      setFormData({ ...formData, full_payment: "" });
      hasError = true;
    }

    if (!paymentDate) {
      setDateError("Please select a date for the additional payment.");
      hasError = true;
    } else {
      if (isWeekend(paymentDate)) {
        setDateError("Weekends are not allowed for payment date.");
        setFormData({ ...formData, fbilling_date: "" });
        hasError = true;
      }
      if (formData.dbilling_date) {
        const toYMD = (d) => {
          const date = new Date(d);
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${y}-${m}-${day}`;
        };
        if (toYMD(paymentDate) > toYMD(formData.dbilling_date)) {
          setDateError("Date cannot exceed payment due date.");
          setFormData({ ...formData, fbilling_date: "" });
          hasError = true;
        }
      }
    }

    if (proofFiles.length === 0) {
      Swal.fire({
        icon: "error",
        title: "Proof of Payment Required",
        text: "Please upload at least one proof of payment before submitting.",
      });
      return;
    }

    if (hasError || paymentError || dateError) {
      ToastHelper.error("Please fix the highlighted fields before saving.");
      return;
    }

    if (!formData.transaction_id) {
      Swal.fire({
        icon: "error",
        title: "Missing Transaction ID",
        text: "Cannot update order because transaction ID is missing.",
      });
      return;
    }

    const newPayment = {
      amount,
      date: paymentDate,
    };
    const newPayments = [newPayment];

    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to update this order?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, update it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const formDataToSend = new FormData();

          Object.entries(formData).forEach(([key, value]) => {
            if (key === "payments") {
              formDataToSend.append(key, JSON.stringify(newPayments));
            } else {
              formDataToSend.append(key, value);
            }
          });

          proofFiles.forEach((file) => {
            formDataToSend.append("proof_files[]", file);
          });

          const res = await fetch(
            "http://localhost/DeliveryTrackingSystem/update_payment_proof.php",
            {
              method: "POST",
              body: formDataToSend,
            }
          );

          const data = await res.json();

          if (data.status === "success") {
            const updatedRes = await fetch(
              `http://localhost/DeliveryTrackingSystem/get_transaction_by_id.php?transaction_id=${formData.transaction_id}`
            );
            const updatedData = await updatedRes.json();

            if (updatedData.form) {
              setFormData(updatedData.form);
              setReceiptData(updatedData.form); 
            }

            ToastHelper.success(
              "Updated successfully!",
              "Order updated successfully.",
              "success"
            );

            onSuccess();
            handleClose();
            setShowReceiptModal(true); 
          } else {
            Swal.fire(
              "Error",
              data.message || "Something went wrong.",
              "error"
            );
          }
        } catch (err) {
          Swal.fire("Error", err.message, "error");
        }
      }
    });
  };

  const formatCurrency = (value) => {
    const num = parseFloat(value);
    return isNaN(num)
      ? "₱0.00"
      : "₱" +
      num.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
  };

  const handlePrintReceipt = () => {
    const element = document.getElementById("receipt-section");
    if (!element) {
      console.error("Receipt section not found!");
      return;
    }

    const transactionId = receiptData?.transaction_id || "N/A";
    const today = new Date().toISOString().split("T")[0];
    const filename = `DP-Receipt_TN${transactionId}_${today}`;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
    <html>
      <head>
        <title>${filename}</title>
        <style>
          @page {
            size: auto;
            margin: 10mm;
          }
          body {
            font-family: "Calibri", "Segoe UI", Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #000;
            display: flex;
            justify-content: center;
            padding: 0;
            margin: 0;
          }
          .receipt {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
          }
          .receipt p {
            margin: 3px 0;
          }

          h3 {
            font-size: 18px;
            margin-bottom: 0;
          }
          p, th {
            font-size: 11px;
          }
          table, td {
            font-size: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          th, td {
            border: 1px solid #000;
            padding: 5px 8px;
            text-align: left;
          }
          th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          .text-center { text-align: center; }
          .text-end { text-align: right; }

          small:contains("Date Generated"),
          p:has(small:contains("Date Generated")) {
            display: block;
            margin-bottom: 10px;
          }

          .signature-container {
            display: flex;
            justify-content: space-around;
            margin-top: 40px;
          }
          .signature {
            text-align: center;
            width: 35%;
            border-top: 1px solid #000;
            padding-top: 4px;
            font-size: 10px;
            font-family: "Calibri", "Segoe UI", Arial, sans-serif;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
         ${element.innerHTML
        .replace("Date Printed:", "Date Generated:")
        .replace(/(<hr>|_{3,}|Prepared By[\s\S]*?Received By)/gi, "") +
      `
            <div class='signature-container'>
              <div class='signature'>Prepared By</div>
              <div class='signature'>Received By</div>
            </div>
          `
      }
        </div>
        <script>
          window.onload = () => {
            window.print();
            // Uncomment to auto-close the print window after printing
            // window.onafterprint = () => window.close();
          };
        </script>
      </body>
    </html>
  `);
    printWindow.document.close();
  };

  return (
    <>
      <Modal
        show={show}
        onHide={handleClose}
        centered
        className="update-payment-modal"
      >
        <Modal.Header
          closeButton
          closeVariant="white"
          style={{ backgroundColor: "#008f4c", opacity: 0.85 }}
        >
          <Modal.Title className="text-white">Update Payment</Modal.Title>
        </Modal.Header>

        <Modal.Body className="bg-white">
          <Form>
            <Row className="px-3">
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Payment Option</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.payment_option || ""}
                    readOnly
                    disabled
                    className="bg-secondary text-dark fw-semibold border-0 bg-opacity-25"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Initial Down Payment</Form.Label>
                  <Form.Control
                    type="text"
                    value={formatCurrency(formData.down_payment)}
                    readOnly
                    disabled
                    className="bg-secondary text-dark fw-semibold border-0 bg-opacity-25"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Remaining Balance</Form.Label>
                  <Form.Control
                    type="text"
                    value={formatCurrency(remainingAfterCurrentPayment())}
                    readOnly
                    disabled
                    className="bg-secondary text-dark fw-semibold border-0 bg-opacity-25"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Additional Payment</Form.Label>
                  <Form.Control
                    type="text"
                    inputMode="decimal"
                    value={displayPayment}
                    onChange={handleFullPaymentChange}
                    onBlur={handleFullPaymentBlur}
                    placeholder="₱0.00"
                    isInvalid={!!paymentError}
                  />
                  {paymentError && (
                    <Form.Text className="text-danger">
                      {paymentError}
                    </Form.Text>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Date of Additional Payment</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.fbilling_date || ""}
                    onChange={handleDateChange}
                    isInvalid={!!dateError}
                    max={maxPaymentDate || undefined}
                  />

                  {dateError && (
                    <Form.Text className="text-danger">{dateError}</Form.Text>
                  )}
                </Form.Group>

                {payments.length > 0 && (
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Recent Payments:
                    </Form.Label>
                    <ul className="list-group small">
                      {payments.map((p, i) => (
                        <li
                          key={i}
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          <span>{`₱${parseFloat(p.amount).toLocaleString(
                            "en-PH",
                            { minimumFractionDigits: 2 }
                          )}`}</span>
                          <span className="text-muted">{p.date}</span>
                        </li>
                      ))}
                    </ul>
                  </Form.Group>
                )}

                <Form.Group className="mb-3">
                  <Form.Label
                    htmlFor="proofOfPayment"
                    className="form-label"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Upload Proof of Payment:
                    <p className="text-secondary fs-6 mb-0">
                      (JPEG/PNG only, multiple allowed)
                    </p>
                  </Form.Label>

                  <div className="d-flex align-items-center">
                    <input
                      type="file"
                      className="form-control"
                      id="proofOfPayment"
                      name="proofOfPayment"
                      accept="image/jpeg,image/png"
                      multiple
                      onChange={handleProofFileChange}
                      ref={proofFileRef}
                    />

                    {selectedFileNames.length > 0 && (
                      <button
                        type="button"
                        className="btn add-item px-3 py-2 btn-sm ms-2 fs-6"
                        style={{ whiteSpace: "nowrap" }}
                        onClick={() => setShowPreviewModal(true)}
                      >
                        View
                      </button>
                    )}
                  </div>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>

        <Modal.Footer className="bg-white">
          <Button
            className="cancel-btn btn fs-6 rounded-2 px-3 py-1"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            className="upd-btn btn-success fs-6 rounded-2 px-3 py-1"
            style={{ fontSize: "16px" }}
            onClick={handleSaveChanges}
          >
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showPreviewModal}
        onHide={() => setShowPreviewModal(false)}
        centered
        size="lg"
        className="proof-preview-modal"
      >
        <Modal.Header
          closeButton
          style={{ backgroundColor: "#00628FFF", color: "white", opacity: 0.85 }}
        >
          <Modal.Title className="fw-semibold">
            Proof of Payment Preview
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="bg-light text-center">
          {proofFiles.length === 0 ? (
            <div className="py-5">
              <i
                className="bi bi-file-earmark-image text-secondary"
                style={{ fontSize: "3rem" }}
              ></i>
              <p className="mt-3 text-muted fs-5">No images uploaded.</p>
            </div>
          ) : (
            <div className="position-relative d-flex align-items-center justify-content-center">
              {currentIndex > 0 && (
                <button
                  onClick={() => setCurrentIndex(currentIndex - 1)}
                  className="btn btn-light rounded-circle shadow position-absolute"
                  style={{ left: "15px", zIndex: 10 }}
                >
                  <FaChevronLeft size={20} />
                </button>
              )}

              <div
                className="bg-white rounded-3 shadow-sm d-flex align-items-center justify-content-center"
                style={{
                  width: "600px",
                  height: "600px",
                  overflow: "hidden",
                  border: "3px solid #ddd",
                }}
              >
                <img
                  src={URL.createObjectURL(proofFiles[currentIndex])}
                  alt={`Proof ${currentIndex + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>

              {currentIndex < proofFiles.length - 1 && (
                <button
                  onClick={() => setCurrentIndex(currentIndex + 1)}
                  className="btn btn-light rounded-circle shadow position-absolute"
                  style={{ right: "15px", zIndex: 10 }}
                >
                  <FaChevronRight size={20} />
                </button>
              )}
            </div>
          )}
        </Modal.Body>

        <Modal.Footer className="bg-white border-top d-flex justify-content-between">
          <span className="text-muted small">
            {proofFiles.length > 0 &&
              `Image ${currentIndex + 1} of ${proofFiles.length}`}
          </span>
          <Button
            variant="secondary"
            className="close-btn px-4 py-2 rounded-3 fw-semibold fs-6"
            onClick={() => setShowPreviewModal(false)}
          >
            Close
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
        </Modal.Header>

        <Modal.Body
          id="receipt-section"
          className="bg-white text-black p-4"
        >
          <div className="text-center mb-4 border-bottom pb-2">
            <h3 className="fw-bold text-success mb-0">ENVIROCOOL</h3>
            <p className="mb-0">Official Down Payment Receipt</p>
            <small>Date Generated: {new Date().toLocaleString()}</small>
          </div>

          <div className="mb-3">
            <p><b>Transaction No.:</b> {receiptData?.transaction_id || "N/A"}</p>
            <p><b>Name:</b> {receiptData?.customer_name || "N/A"}</p>
            <p><b>Payment Option:</b> {receiptData?.payment_option || "N/A"}</p>
            <p><b>Initial Down Payment:</b> {formatCurrency(receiptData?.down_payment || 0)}</p>
            <p><b>Additional Payment:</b> {formatCurrency(receiptData?.additional_payment || 0)}</p>
            <p><b>Date of Additional Payment:</b> {receiptData?.additional_payment_date || "N/A"}</p>
            <p><b>Remaining Balance:</b> {formatCurrency(receiptData?.balance || 0)}</p>
            <p><b>Payment Status:</b> {parseFloat(receiptData?.balance || 0) > 0 ? "Partially Paid" : "Fully Paid"}</p>          </div>
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
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default UpdateOrderModal;