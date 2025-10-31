import React, { useState, useRef } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import Swal from "sweetalert2";

const UpdateOrderModal = ({
  show,
  handleClose,
  handleSubmit,
  formData,
  setFormData,
}) => {
  const [previousValue, setPreviousValue] = useState(
    formData.full_payment || "0"
  );

  const [proofFiles, setProofFiles] = useState([]);
  const [selectedFileNames, setSelectedFileNames] = useState([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const proofFileRef = useRef(null);

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
        };

        cleanFormData.proof_files = proofFiles;

        setFormData(cleanFormData);
        handleSubmit();
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

  const handleFullPaymentChange = (e) => {
    let rawValue = e.target.value.replace(/[^0-9.]/g, "");

    const parts = rawValue.split(".");
    if (parts.length > 2) rawValue = parts[0] + "." + parts.slice(1).join("");

    const num = parseFloat(rawValue) || 0;

    const total = parseFloat(formData.total || 0);
    const downPayment = parseFloat(formData.down_payment) || 0;
    const remaining = total - downPayment;

    if (num > remaining) {
      Swal.fire({
        icon: "error",
        title: "Payment exceeds balance!",
        text: `The entered amount (₱${num.toLocaleString("en-PH", {
          minimumFractionDigits: 2,
        })}) exceeds the remaining balance (₱${remaining.toLocaleString(
          "en-PH",
          { minimumFractionDigits: 2 }
        )}).`,
        confirmButtonColor: "#d33",
      });
      setFormData({ ...formData, full_payment: previousValue });
      return;
    }

    const newBalance = (remaining - num).toFixed(2);

    setPreviousValue(rawValue);
    setFormData({
      ...formData,
      full_payment: rawValue,
      balance: newBalance,
    });
  };

  const handleFullPaymentBlur = (e) => {
    const num = parseFloat(formData.full_payment);
    if (!isNaN(num)) {
      setFormData({ ...formData, full_payment: num.toFixed(2) });
      e.target.value = formatCurrency(num);
    } else {
      e.target.value = "₱0.00";
    }
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
                    value={formatCurrency(formData.balance)}
                    readOnly
                    disabled
                    className="bg-secondary text-dark fw-semibold border-0 bg-opacity-25"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Final Payment</Form.Label>
                  <Form.Control
                    type="text"
                    inputMode="decimal"
                    value={
                      formData.full_payment
                        ? `₱${formData.full_payment}`.replace(
                            /\B(?=(\d{3})+(?!\d))/g,
                            ","
                          )
                        : "₱0.00"
                    }
                    onChange={handleFullPaymentChange}
                    onBlur={handleFullPaymentBlur}
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
                        View ({selectedFileNames.length})
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
            className="cancel-btn btn d-flex align-items-center gap-2 fs-6 rounded-2 px-3 py-1"
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

      <Modal
        show={showPreviewModal}
        onHide={() => setShowPreviewModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Uploaded Proof of Payment</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {proofFiles.length === 0 ? (
            <p>No images uploaded.</p>
          ) : (
            <div className="d-flex flex-wrap justify-content-center gap-3">
              {proofFiles.map((file, i) => (
                <img
                  key={i}
                  src={URL.createObjectURL(file)}
                  alt="Proof"
                  style={{
                    width: "600px",
                    height: "600px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    borderWidth: "2px",
                  }}
                />
              ))}
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowPreviewModal(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default UpdateOrderModal;
