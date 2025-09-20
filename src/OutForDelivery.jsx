import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Container,
  Card,
  Modal,
  Form,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaSyncAlt } from "react-icons/fa";
import Sidebar from "./DriverSidebar";
import HeaderAndNav from "./DriverHeaderAndNav";
import axios from "axios";

function OutForDelivery() {
  const [deliveries, setDeliveries] = useState([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const [showProofModal, setShowProofModal] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [deliveryToMark, setDeliveryToMark] = useState(null);

  
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState("success"); 
  const [showToast, setShowToast] = useState(false);

  
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const [showCameraConfirm, setShowCameraConfirm] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const formatCurrency = (amount) =>
    `₱${Number(amount).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.pers_username) return;

    axios
      .post(
        "http://localhost/DeliveryTrackingSystem/fetch_out_for_delivery.php",
        { pers_username: user.pers_username }
      )
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        setDeliveries(data);
        setFilteredDeliveries(data);
      })
      .catch((err) => {
        console.error("Error fetching deliveries:", err);
        showToastMessage("danger", "⚠️ Failed to fetch deliveries.");
      });
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredDeliveries(deliveries);
    } else {
      const filtered = deliveries.filter(
        (d) =>
          d.transactionNo.toString().includes(searchTerm) ||
          d.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDeliveries(filtered);
    }
  }, [searchTerm, deliveries]);


  const showToastMessage = (variant, message) => {
    setToastVariant(variant);
    setToastMessage(message);
    setShowToast(true);
  };

  const startCamera = async () => {
    try {
      const constraints = { video: { facingMode } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      showToastMessage("danger", "⚠️ Unable to access camera: " + err.message);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const switchCamera = () => {
    stopCamera();
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
    setTimeout(() => startCamera(), 300);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "proof.jpg", { type: "image/jpeg" });
          setProofFile(file);
          stopCamera();
        }
      }, "image/jpeg");
    }
  };

  const handleCancelClick = (delivery) => {
    setSelectedDelivery(delivery);
    setShowCancelModal(true);
  };

  const confirmCancellation = () => {
    if (!cancelReason) {
      showToastMessage("danger", "⚠️ Please select a cancellation reason.");
      return;
    }

    axios
      .post("http://localhost/DeliveryTrackingSystem/cancelled_delivery.php", {
        transaction_id: selectedDelivery.transactionNo,
        reason: cancelReason,
      })
      .then((res) => {
        if (res.data.success) {
          setDeliveries(
            deliveries.filter(
              (d) => d.transactionNo !== selectedDelivery.transactionNo
            )
          );
          setFilteredDeliveries(
            filteredDeliveries.filter(
              (d) => d.transactionNo !== selectedDelivery.transactionNo
            )
          );
          setShowCancelModal(false);
          setSelectedDelivery(null);
          setCancelReason("");

          showToastMessage("success", "❌ Delivery cancelled successfully.");
          navigate("/failed-delivery");
        } else {
          showToastMessage(
            "danger",
            res.data.message || "⚠️ Cancellation failed."
          );
        }
      })
      .catch((err) => {
        console.error(err);
        showToastMessage("danger", "⚠️ Error cancelling delivery.");
      });
  };

 const handleProofSubmit = () => {
   if (!proofFile) {
     showToastMessage("danger", "⚠️ Please capture a photo first.");
     return;
   }

   const formData = new FormData();
   formData.append("transaction_id", deliveryToMark.transactionNo);
   formData.append("proof_of_delivery", proofFile);

   axios
     .post(
       "http://localhost/DeliveryTrackingSystem/upload_proof.php",
       formData,
       {
         headers: { "Content-Type": "multipart/form-data" },
       }
     )
     .then((res) => {
       if (res.data.success) {
         showToastMessage("success", "Proof submitted successfully!");
         setDeliveries(
           deliveries.filter(
             (d) => d.transactionNo !== deliveryToMark.transactionNo
           )
         );
         setFilteredDeliveries(
           filteredDeliveries.filter(
             (d) => d.transactionNo !== deliveryToMark.transactionNo
           )
         );
         setProofFile(null);
         setDeliveryToMark(null);
         stopCamera();
         setShowProofModal(false); 
      
       } else {
         showToastMessage(
           "danger",
           res.data.message || "Failed to upload proof."
         );
         stopCamera();
         setShowProofModal(false); 
       }
     })
     .catch((err) => {
       console.error(err);
       showToastMessage("danger", "⚠️ Failed to submit proof.");
       stopCamera();
       setShowProofModal(false); 
     });
 };


  return (
    <div style={{ backgroundColor: "#f0f4f7", minHeight: "100vh" }}>
      <HeaderAndNav
        onSidebarToggle={() => setShowSidebar(true)}
        onSearch={setSearchTerm}
      />
      <Sidebar show={showSidebar} onHide={() => setShowSidebar(false)} />

      {/* ✅ Toast Notification */}
      {/* ✅ Toast Notification */}
      <ToastContainer position="top-center" className="mt-3">
        <Toast
          onClose={() => setShowToast(false)}
          show={showToast}
          delay={3000}
          autohide
          className={`border-0 text-white bg-${toastVariant}`}
        >
          <Toast.Body className="text-center fw-bold">
            {toastMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>

      <Container className="py-4">
        <br />
        <h2 className="text-center text-success fw-bold mb-3">
          OUT FOR DELIVERY
        </h2>
        <br />
        {filteredDeliveries.length === 0 ? (
          <p className="text-muted text-center">No deliveries found.</p>
        ) : (
          filteredDeliveries.map((delivery, idx) => (
            <Card
              key={idx}
              className="mb-4 p-3 border border-info rounded"
              style={{ backgroundColor: "#eaf7f7" }}
            >
              <h5 className="text-center fw-bold text-dark mb-3">
                TRANSACTION NO. {delivery.transactionNo}
              </h5>
              <div className="border p-3 rounded bg-white">
                <div className="d-flex justify-content-between mb-1">
                  <strong>Customer:</strong>
                  <span>{delivery.customerName}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <strong>Address:</strong>
                  <span>{delivery.address}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <strong>Contact:</strong>
                  <span>{delivery.contact}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <strong>Payment:</strong>
                  <span>{delivery.paymentMode}</span>
                </div>

                <strong className="d-block mb-1">Items:</strong>
                {delivery.items.map((item, i) => (
                  <div
                    key={i}
                    className="d-flex justify-content-between mb-1 ps-3"
                  >
                    <span>
                      {item.name}{" "}
                      <span style={{ fontWeight: "bold", color: "#198754" }}>
                        x{item.qty}
                      </span>
                    </span>
                    <span style={{ display: "flex", gap: "10px" }}>
                      <span>{formatCurrency(item.unitCost)}</span> |{" "}
                      <span>{formatCurrency(item.qty * item.unitCost)}</span>
                    </span>
                  </div>
                ))}

                <hr className="my-2" style={{ borderTop: "2px dashed #999" }} />

                <div className="d-flex justify-content-between mb-3">
                  <strong>Total:</strong>
                  <span className="fw-bold">
                    {formatCurrency(delivery.totalCost)}
                  </span>
                </div>
              </div>

              <div className="d-flex justify-content-center gap-2 mt-3">
                <Button
                  className="btn-green-custom"
                  size="sm"
                  style={{
                    backgroundColor: "#198754",
                    borderColor: "#198754",
                    borderRadius: "10px",
                  }}
                  onClick={() => {
                    setDeliveryToMark(delivery);
                    setShowCameraConfirm(true);
                  }}
                >
                  Mark as Delivered
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  style={{ borderRadius: "10px" }}
                  onClick={() => handleCancelClick(delivery)}
                >
                  Delivery Attempt Failed
                </Button>
              </div>
            </Card>
          ))
        )}
      </Container>

      {/* Camera Confirmation Modal */}
      <Modal
        show={showCameraConfirm}
        onHide={() => setShowCameraConfirm(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Camera Permission</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          This app wants to access your camera to take proof of delivery. Do you
          allow it?
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowCameraConfirm(false)}
          >
            Deny
          </Button>
          <Button
            className="btn-green-custom"
            onClick={() => {
              setShowCameraConfirm(false);
              setShowProofModal(true);
              startCamera();
            }}
          >
            Allow
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Proof Modal */}
      <Modal
        show={showProofModal}
        onHide={() => {
          stopCamera();
          setShowProofModal(false);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Take Proof of Delivery</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center position-relative">
          {!proofFile ? (
            <>
              <div style={{ position: "relative", display: "inline-block" }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: "100%",
                    maxHeight: "500px",
                    height: "300px",
                    borderRadius: "8px",
                    background: "#000000ff",
                  }}
                />
                <FaSyncAlt
                  onClick={switchCamera}
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    fontSize: "22px",
                    color: "#fff",
                    cursor: "pointer",
                    background: "rgba(0,0,0,0.5)",
                    borderRadius: "50%",
                    padding: "6px",
                  }}
                  title="Switch Camera"
                />
              </div>
              <canvas ref={canvasRef} width="300" height="200" hidden></canvas>
              <div className="mt-2 d-flex justify-content-center">
                <Button className="btn-green-custom" onClick={capturePhoto}>
                  Capture Photo
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="fw-bold">Preview:</p>
              <img
                src={URL.createObjectURL(proofFile)}
                alt="Preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: "500px",
                  height: "300px",
                  borderRadius: "8px",
                }}
              />
              <div className="mt-2">
                <Button
                  variant="primary"
                  onClick={() => {
                    setProofFile(null);
                    startCamera();
                  }}
                >
                  Retake
                </Button>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="danger"
            onClick={() => {
              stopCamera();
              setShowProofModal(false);
            }}
          >
            Cancel
          </Button>
          <Button className="btn-green-custom" onClick={handleProofSubmit}>
            Submit
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        show={showCancelModal}
        onHide={() => setShowCancelModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Select Cancellation Reason</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Select
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          >
            <option value="">-- Select Reason --</option>
            <option value="Vehicle-related Issue">Vehicle-related issue</option>
            <option value="Location Inaccessible">Location inaccessible</option>
          </Form.Select>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
            Close
          </Button>
          <Button variant="danger" onClick={confirmCancellation}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default OutForDelivery;
