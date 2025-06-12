import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa"; 
import AdminLayout from "./AdminLayout";
import { useEffect } from "react";

const ViewOrder = () => {
  const navigate = useNavigate();

    useEffect(() => {
      document.title = "View Order Details";
    }, []);

  const [orderDetails, setOrderDetails] = useState({
    customerName: "Daniel Padilla",
    customerAddress: "123 Main St",
    contactNumber: "09123456789",
    paymentMode: "Cash On Delivery",
    items: [
      {
        name: "Samsung S-Inverter Split Type Aircon",
        quantity: 4,
        price: 6000,
      },
    ],
  });

  const totalCost = orderDetails.items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  return (
    <AdminLayout title="View Order Details">
      {/* ✅ Back Button Positioned at the Top */}
      <div className="d-flex justify-content-start mt-4 ms-4">
        <button
          className="btn d-flex align-items-center gap-2 fs-4"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft />
        </button>
      </div>

      <div className="container mt-4 w-75">
        <div className="card shadow-lg border-0 rounded-4">
          <div className="card-body">
            <h2 className="card-title text-center fw-bold text-success">
              Transaction No. 000000001
            </h2>
            <hr />

            {/* Customer Details */}
            <div className="mb-3 p-3 bg-light border rounded-3 shadow-sm">
              <h5 className="text-success">Customer Details</h5>
              <p><strong>Name:</strong> {orderDetails.customerName}</p>
              <p><strong>Address:</strong> {orderDetails.customerAddress}</p>
              <p><strong>Contact:</strong> {orderDetails.contactNumber}</p>
              <p><strong>Payment Mode:</strong> {orderDetails.paymentMode}</p>
            </div>

            {/* Items Ordered */}
            <div className="mb-3 p-3 bg-light border rounded-3 shadow-sm">
              <h5 className="text-success">Items Ordered</h5>
              <ul className="list-group list-group-flush">
                {orderDetails.items.map((item, index) => (
                  <li
                    key={index}
                    className="list-group-item d-flex justify-content-between"
                  >
                    <span>{item.name} x{item.quantity}</span>
                    <span className="fw-bold">
                      ₱{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="text-end mt-4">
                <h4 className="fw-bold text-success m-3">
                  Total Cost: ₱{totalCost.toLocaleString()}
                </h4>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="buttons d-flex justify-content-center gap-5 mt-5">
              <button className="btn btn-success px-5 py-2 rounded-3">
                Update
              </button>
              <button className="btn btn-danger px-5 py-2 rounded-3 ">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ViewOrder;
