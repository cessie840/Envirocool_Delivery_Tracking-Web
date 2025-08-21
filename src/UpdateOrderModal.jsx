import React, { useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";

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

  // 🔹 Automatically update total and balance when items change
  useEffect(() => {
    const down_payment = parseFloat(formData.down_payment) || 0;
    const balance = total - down_payment;
    setFormData((prev) => ({
      ...prev,
      total: total.toFixed(2),
      balance: balance.toFixed(2),
    }));
  }, [editableItems, total]);

  const handleDownPaymentChange = (e) => {
    const down_payment = parseFloat(e.target.value) || 0;
    const balance = total - down_payment;
    setFormData({
      ...formData,
      down_payment,
      balance: balance.toFixed(2),
      total: total.toFixed(2),
    });
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton className="bg-success" closeVariant="white">
        <Modal.Title className="text-white">Update Delivery Info</Modal.Title>
      </Modal.Header>

      <Modal.Body className="bg-light">
        <Form>
          <div className="p-3 bg-white rounded shadow-sm border mb-4">
            <h5 className="text-success fw-bold mb-3">Customer Information</h5>

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
                  setFormData({ ...formData, customer_address: e.target.value })
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

            <div className="mb-3">
              <label className="form-label fw-bold">Payment Mode</label>
              <select
                name="mode_of_payment"
                value={formData.mode_of_payment}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    mode_of_payment: e.target.value,
                  }))
                }
                className="form-select"
              >
                <option value="Cash">Cash</option>
                <option value="COD">Cash on Delivery (COD)</option>
                <option value="Card">Card</option>
              </select>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Down Payment</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                name="down_payment"
                value={formData.down_payment}
                onChange={handleDownPaymentChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Balance</Form.Label>
              <Form.Control
                type="number"
                name="balance"
                value={formData.balance}
                readOnly
              />
            </Form.Group>
          </div>

          <div className="p-3 bg-white rounded shadow-sm border">
            <h5 className="text-success fw-bold mb-3">Items Ordered</h5>
            {editableItems.map((item, index) => (
              <div
                key={index}
                className="p-3 mb-3 border rounded shadow-sm bg-light-subtle"
              >
                <Form.Group className="mb-2">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    type="text"
                    value={item.description}
                    onChange={(e) => {
                      const newItems = [...editableItems];
                      newItems[index].description = e.target.value;
                      setEditableItems(newItems);
                    }}
                  />
                </Form.Group>

                <div className="d-flex gap-3">
                  <Form.Group className="mb-2 flex-grow-1">
                    <Form.Label>Quantity</Form.Label>
                    <Form.Control
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...editableItems];
                        newItems[index].quantity =
                          parseInt(e.target.value) || 0;
                        setEditableItems(newItems);
                      }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-2 flex-grow-1">
                    <Form.Label>Unit Cost</Form.Label>
                    <Form.Control
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.unit_cost}
                      onChange={(e) => {
                        const newItems = [...editableItems];
                        newItems[index].unit_cost =
                          parseFloat(e.target.value) || 0;
                        setEditableItems(newItems);
                      }}
                    />
                  </Form.Group>
                </div>
              </div>
            ))}

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
        <Button variant="success" onClick={handleSubmit}>
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UpdateOrderModal;
