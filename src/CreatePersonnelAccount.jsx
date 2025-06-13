import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OperationalLayout from "./OperationalLayout";

const AddDelivery = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Create Delivery Personnel Account";
  }, []);

  return (
    <OperationalLayout title="Create Delivery Personnel Account">
      <div className="add-delivery-form-container mt-5 mx-auto">
        <div className="form-card mx-auto">
          <h2 className="form-title">PERSONAL DETAILS</h2>
          <hr />
          <form className="personnel-form">
            {/* Row 1: First Name, Last Name, Gender */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">
                  First Name <span className="required">*</span>
                </label>
                <input type="text" id="firstName" placeholder="First Name" />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">
                  Last Name <span className="required">*</span>
                </label>
                <input type="text" id="lastName" placeholder="Last Name" />
              </div>
              <div className="form-group">
                <label htmlFor="gender">
                  Gender <span className="required">*</span>
                </label>
                <input type="text" id="gender" placeholder="Gender" />
              </div>
            </div>

            {/* Row 2: Birthdate, Age */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="birthdate">
                  Birthdate <span className="required">*</span>
                </label>
                <input type="text" id="birthdate" placeholder="MM/DD/YYYY" />
              </div>
              <div className="form-group">
                <label htmlFor="age">
                  Age <span className="required">*</span>
                </label>
                <input type="number" id="age" placeholder="Age" />
              </div>
            </div>

            {/* Row 3: Email, Contact Number */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">
                  Email <span className="required">*</span>
                </label>
                <input type="email" id="email" placeholder="Email" />
              </div>
              <div className="form-group">
                <label htmlFor="contact">
                  Contact Number <span className="required">*</span>
                </label>
                <input type="text" id="contact" placeholder="Contact Number" />
              </div>
            </div>
          </form>
        </div>
        <div className="d-flex justify-content-end mt-4">
          <button className="add-btn bg-success" onClick={() => navigate("/register-account")}>
                       Proceed
                    </button>
        </div>
      </div>
    </OperationalLayout>
  );
};

export default AddDelivery;
