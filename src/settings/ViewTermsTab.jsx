import React from "react";

const ViewTermsTab = () => {
  return (
    <div className="terms p-4">
      <h4 className="title">Terms and Conditions</h4>
      <p className="mb-2 text-secondary fw-medium">
        Envirocool Delivery & Monitoring System
      </p>
      <p className="mb-4 text-sm text-muted">Last Updated: September 19, 2025</p>

      {/* Scrollable container */}
      <div className="max-h-96 overflow-y-auto border px-5 py-4 rounded-4 bg-gray-50 fw-normal">
        <p>
          Welcome to the Envirocool Delivery & Monitoring System (“System”).
          These Terms and Conditions (“Terms”) govern the use of the System by
          Admins, Operational Managers, and Delivery Personnel. By accessing or
          using the System, you agree to comply with these Terms.
        </p>

        <h5 className="font-semibold mt-4">1. Purpose of the System</h5>
        <p>
          The Envirocool System is designed to support Envirocool Company’s
          operations in selling, delivering, and monitoring air conditioning
          units and related services. The System is strictly for official
          business use only.
        </p>

        <h5 className="font-semibold mt-4">2. User Roles and Responsibilities</h5>
        <h6 className="mt-2 fw-bold" style={{ color: "#0c759d" }}>
          2.1 Admin
        </h6>
        <ul className="list-disc list-inside">
          <li>Add and manage delivery transactions (customer, order, and payment details).</li>
          <li>Reschedule cancelled deliveries.</li>
          <li>View and update transaction details.</li>
          <li>Monitor deliveries through GPS.</li>
          <li>Generate reports (sales, transactions, deliveries, customer satisfaction).</li>
          <li>Export reports in PDF.</li>
          <li>Manage account settings (edit profile, change password, backup and restore).</li>
          <li>Manage these Terms & Conditions.</li>
        </ul>

        <h6 className="mt-3 fw-bold" style={{ color: "#0c759d" }}>
          2.2 Operational Manager
        </h6>
        <ul className="list-disc list-inside">
          <li>Create and manage delivery personnel accounts.</li>
          <li>View delivery transactions.</li>
          <li>Assign or reassign delivery personnel.</li>
          <li>Monitor assigned and unassigned orders.</li>
          <li>Manage account settings (edit profile, change password, terms and conditions).</li>
        </ul>

        <h6 className="mt-3 fw-bold" style={{ color: "#0c759d" }}>
          2.3 Delivery Personnel
        </h6>
        <ul className="list-disc list-inside">
          <li>View assigned deliveries.</li>
          <li>Update delivery status (Out for Delivery, Delivered, Cancelled).</li>
        </ul>

        <h5 className="font-semibold mt-4">3. Data Privacy and Protection</h5>
        <p>
          Envirocool respects and protects personal data in compliance with the
          <b> Data Privacy Act of 2012 (Republic Act No. 10173).</b>
        </p>
        <ul className="list-disc list-inside">
          <li>Only authorized users may access customer and transaction data.</li>
          <li>
            All personal information collected (e.g., names, addresses, contact
            numbers, payment details) shall be used solely for transaction
            processing and service improvement.
          </li>
          <li>
            Users are prohibited from sharing, disclosing, or misusing any
            personal or company data accessed through the System.
          </li>
          <li>
            Any unauthorized access, sharing, or breach of customer information
            will be subject to disciplinary action and may lead to legal
            liability under the Data Privacy Act.
          </li>
        </ul>

        <h5 className="font-semibold mt-4">4. Security of Accounts</h5>
        <ul className="list-disc list-inside">
          <li>
            Each user is responsible for maintaining the confidentiality of
            their account credentials.
          </li>
          <li>Sharing of usernames and passwords is strictly prohibited.</li>
          <li>Users must immediately report any suspected unauthorized access.</li>
        </ul>

        <h5 className="font-semibold mt-4">5. Acceptable Use</h5>
        <p>By using the System, you agree to:</p>
        <ul className="list-disc list-inside">
          <li>Use the System only for official company purposes.</li>
          <li>Enter accurate and truthful data at all times.</li>
          <li>Not attempt to modify, hack, or exploit the System in any way.</li>
          <li>
            Not use the System for personal gain or activities outside company
            operations.
          </li>
        </ul>

        <h5 className="font-semibold mt-4">6. Reports and Monitoring</h5>
        <ul className="list-disc list-inside">
          <li>The System generates reports for internal use only.</li>
          <li>
            Data visualizations (charts, tables, PDFs) must not be altered or
            misrepresented.
          </li>
          <li>
            Only authorized management may use these reports for
            decision-making.
          </li>
        </ul>

        <h5 className="font-semibold mt-4">7. Limitation of Liability</h5>
        <p>Envirocool Company shall not be held liable for:</p>
        <ul className="list-disc list-inside">
          <li>User errors in data entry or delivery handling.</li>
          <li>Delays caused by incorrect information entered in the System.</li>
          <li>
            Unauthorized use of accounts due to negligence of the user.
          </li>
        </ul>

        <h5 className="font-semibold mt-4">8. Amendments to Terms</h5>
        <p>
          Envirocool Company reserves the right to update or amend these Terms
          at any time. Updates will be posted in the System under the “Terms and
          Conditions” section. Continued use of the System after updates means
          acceptance of the revised Terms.
        </p>

        <h5 className="font-semibold mt-4">9. Acknowledgment</h5>
        <p>
          By accessing and using the Envirocool Delivery & Monitoring System,
          you acknowledge that you have read, understood, and agreed to these
          Terms and Conditions.
        </p>
      </div>
    </div>
  );
};

export default ViewTermsTab;
