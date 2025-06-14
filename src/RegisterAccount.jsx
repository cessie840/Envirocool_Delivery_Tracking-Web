import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OperationalLayout from "./OperationalLayout";

const AddDelivery = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Register Account";
  }, []);

  return (
    <OperationalLayout title="Create Delivery Personnel Account">
      <div className="add-delivery-form-container mt-5 mx-auto">
        <div className="form-card mx-auto p-4">
          <h2 className="form-title text-center">REGISTER ACCOUNT</h2>
          <hr />
          <form className="personnel-form">
            <div className="form-group mt-3">
              <label htmlFor="username">
                Username <span className="required">*</span>
              </label>
              <input type="text" id="username" placeholder="Username" />
            </div>

            <div className="form-group mt-3">
              <label htmlFor="password">
                Password <span className="required">*</span>
              </label>
              <input type="password" id="password" placeholder="Password" />
            </div>

            <div className="form-group mt-3">
              <label htmlFor="confirmPassword">
                Confirm Password <span className="required">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="Confirm Password"
              />
            </div>

            <div className="form-group mt-3">
              <label htmlFor="profilePicture">
                Upload Profile Picture <span className="required">*</span>
              </label>
              <input type="file" id="profilePicture" className="form-control" />
            </div>
          </form>
        </div>
        <div className="d-flex justify-content-end mt-4">
          <button type="submit" className="btn bg-success add-btn rounded-3 px-3">
            Register
          </button>
        </div>
      </div>
    </OperationalLayout>
  );
};

export default AddDelivery;
