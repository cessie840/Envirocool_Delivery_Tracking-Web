import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { ToastHelper } from "./helpers/ToastHelper";

const RescheduleModal = ({
  show,
  handleClose,
  transaction_id,
  onReschedule,
}) => {
  const [newDate, setNewDate] = useState("");

  const handleSubmit = () => {
    if (!newDate) {
      ToastHelper.error("Please select a new delivery date.");
      return;
    }

    fetch("http://localhost/DeliveryTrackingSystem/reschedule_delivery.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transaction_id,
        target_date_delivery: newDate,
      }),
    })
      .then((res) => res.json())
      .then((response) => {
        if (response.success) {
          ToastHelper.success("Reschedule successful!");
          onReschedule({
            delivery_status: "Pending",
            target_date_delivery: response.new_date,
            cancelled_reason: null,
          });
          window.dispatchEvent(new Event("deliveryRescheduled"));
          handleClose();
          setNewDate("");
        } else {
          ToastHelper.error("Failed to reschedule delivery.");
          console.error("Reschedule failed:", response.message, response.error);
        }
      })
      .catch((err) => {
        console.error("Reschedule error:", err);
        ToastHelper.error("An error occurred.");
      });
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton style={{ backgroundColor: "#208EB9" }}>
        <Modal.Title className="text-white">Reschedule Delivery</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Label>Select New Delivery Date</Form.Label>
            <Form.Control
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button
          className="close-btn py-1 fs-6"
          variant="secondary"
          onClick={handleClose}
        >
          Cancel
        </Button>
        <Button onClick={handleSubmit} className="btn-view py-1 fs-6">
          Confirm Reschedule
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RescheduleModal;
