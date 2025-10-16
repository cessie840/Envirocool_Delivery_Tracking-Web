import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Form } from "react-bootstrap";
import AdminLayout from "./AdminLayout";
import UpdateOrderModal from "./UpdateOrderModal";

const DeliveryDetails = () => {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [filter, setFiltered] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editableItems, setEditableItems] = useState([]);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_address: "",
    customer_contact: "",
    mode_of_payment: "",
    down_payment: "",
    balance: "",
    total: "",
  });
  const [transactionId, setTransactionId] = useState(null);

  const [statusFilter, setStatusFilter] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return dateString.split("T")[0] || dateString.split(" ")[0];
  };
  const fetchDeliveries = () => {
    fetch("http://localhost/DeliveryTrackingSystem/get_deliveries.php")
      .then((res) => res.json())
      .then((data) => {
        setDeliveries(data);
        setFiltered(data);
      })
      .catch((err) => console.error("Failed to fetch deliveries:", err));
  };

  useEffect(() => {
    document.title = "Admin Delivery Details";
    fetchDeliveries();
  }, []);

  const handleUpdate = (id) => {
    setTransactionId(id);
    fetch(
      `http://localhost/DeliveryTrackingSystem/view_deliveries.php?transaction_id=${id}`
    )
      .then((res) => res.json())
      .then((data) => {
        const fixedItems = data.items.map((item) => ({
          quantity: item.quantity,
          type_of_product: item.type_of_product || "",
          description: item.description || "",
          unit_cost: parseFloat(item.unit_cost) || 0,
        }));

        setEditableItems(fixedItems);

        setFormData({
          tracking_number: data.tracking_number || "",
          customer_name: data.customer_name || "",
          customer_address: data.customer_address || "",
          customer_contact: data.customer_contact || "",
          date_of_order: data.date_of_order || "",
          target_date_delivery: formatDate(data.target_date_delivery),
          mode_of_payment: data.mode_of_payment || "",
          payment_option: data.payment_option || "Full Payment",
          down_payment: parseFloat(data.down_payment) || 0,
          balance: parseFloat(data.balance) || 0,
          total: parseFloat(data.total) || 0,
        });

        setShowModal(true);
      })
      .catch((err) => console.error("Failed to fetch order:", err));
  };

  const handleSubmit = () => {
    if (!/^09\d{9}$/.test(formData.customer_contact)) {
      alert("Contact number must start with '09' and be exactly 11 digits.");
      return;
    }

    const total = editableItems.reduce(
      (sum, item) => sum + item.quantity * item.unit_cost,
      0
    );

    const down_payment = parseFloat(formData.down_payment) || 0;
    const balance = total - down_payment;

    fetch("http://localhost/DeliveryTrackingSystem/update_delivery.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transaction_id: transactionId,
        ...formData,
        total,
        balance,
        items: editableItems,
      }),
    })
      .then((res) => res.json())
      .then((response) => {
        if (response.status === "success") {
          alert("Update successful!");
          fetchDeliveries();
          setShowModal(false);
        } else {
          console.error("Update response:", response);
          alert("Update failed.");
        }
      })
      .catch((err) => {
        console.error("Update error:", err);
        alert("An error occurred.");
      });
  };

  const handleAddDelivery = () => navigate("/add-delivery");

  const applyFilters = (list, term, status) => {
    const lower = term.toLowerCase();
    return list.filter((e) => {
      const matchesSearch =
        (e.transaction_id &&
          e.transaction_id.toString().toLowerCase().includes(lower)) ||
        (e.tracking_number &&
          e.tracking_number.toString().toLowerCase().includes(lower)) ||
        (e.customer_name && e.customer_name.toLowerCase().includes(lower)) ||
        (e.delivery_status &&
          e.delivery_status.toLowerCase().includes(lower)) ||
        (e.description && e.description.toLowerCase().includes(lower));

      const matchesStatus = status === "All" || e.delivery_status === status;

      return matchesSearch && matchesStatus;
    });
  };

  const handleSearch = (term) => {
    setFiltered(applyFilters(deliveries, term, statusFilter));
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setFiltered(applyFilters(deliveries, "", status));
  };

  const groupedDeliveries = filter.reduce((acc, item) => {
    const id = item.transaction_id;

    if (!acc[id]) {
      acc[id] = {
        transaction_id: id,
        customer_name: item.customer_name,
        tracking_number: item.tracking_number,
        total: item.total,
        delivery_status: item.delivery_status,
        items: [],
      };
    }

    acc[id].items.push({
      description: item.description,
      quantity: item.quantity,
    });

    return acc;
  }, {});

  const allDeliveries = Object.values(groupedDeliveries).sort(
    (a, b) => b.transaction_id - a.transaction_id
  );

  // 🔹 Pagination logic
  const totalPages = Math.ceil(allDeliveries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDeliveries = allDeliveries.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <AdminLayout
      title="Delivery Details"
      onAddClick={handleAddDelivery}
      showSearch={true}
      onSearch={handleSearch}
    >
      <div className="mb-3 d-flex justify-content-end ">
        <Form.Select
          value={statusFilter}
          onChange={(e) => handleStatusFilter(e.target.value)}
          style={{
            width: "250px",
            border: "1px solid #CADBC8FF ",
            fontWeight: "500",
          }}
        >
          <option value="All">Filter by Delivery Status</option>
          <option value="Pending">Pending</option>
          <option value="Out for Delivery">Out for Delivery</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </Form.Select>
      </div>

      <Table
        bordered
        hover
        responsive
        className="delivery-table container-fluid table-responsive bg-white"
      >
        <thead>
          <tr>
            <th>Transaction No.</th>
            <th>Tracking No.</th>
            <th>Client Name</th>
            <th>Delivery Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedDeliveries.length > 0 ? (
            paginatedDeliveries.map((group, index) => (
              <tr key={index} className="delivery-table-hover">
                <td>{group.transaction_id}</td>
                <td>{group.tracking_number}</td>
                <td>{group.customer_name}</td>

                <td>
                  <span
                    style={{
                      backgroundColor:
                        group.delivery_status === "Delivered"
                          ? "#C6FCD3"
                          : group.delivery_status === "Cancelled"
                          ? "#FDE0E0"
                          : group.delivery_status === "Pending"
                          ? "#FFF5D7"
                          : group.delivery_status === "Out for Delivery"
                          ? "#d2e6f5ff"
                          : "transparent",
                      color:
                        group.delivery_status === "Delivered"
                          ? "#3E5F44"
                          : group.delivery_status === "Cancelled"
                          ? "red"
                          : group.delivery_status === "Pending"
                          ? "#FF9D23"
                          : group.delivery_status === "Out for Delivery"
                          ? "#1762b1ff"
                          : "black",
                      padding: "5px",
                      borderRadius: "8px",
                      display: "inline-block",
                      minWidth: "80px",
                      textAlign: "center",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                    }}
                  >
                    {group.delivery_status}
                  </span>
                </td>
                <td className="align-middle text-center">
                  <div className="action-btn d-flex justify-content-center gap-2 py-2">
                    <button
                      className="btn btn-view"
                      onClick={() =>
                        navigate(`/view-delivery/${group.transaction_id}`)
                      }
                    >
                      View
                    </button>
                    <button
                      className="btn upd-btn"
                      onClick={() => handleUpdate(group.transaction_id)}
                    >
                      Update
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center py-4">
                No deliveries found.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      <div className="custom-pagination d-flex justify-content-center align-items-center mt-3">
        <button
          className="page-btn btn btn-white mx-1"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          ‹
        </button>
        <span className="page-info mx-2">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="page-btn btn btn-white mx-1"
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          ›
        </button>
      </div>

      <UpdateOrderModal
        show={showModal}
        handleClose={() => setShowModal(false)}
        handleSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        editableItems={editableItems}
        setEditableItems={setEditableItems}
      />
    </AdminLayout>
  );
};

export default DeliveryDetails;
