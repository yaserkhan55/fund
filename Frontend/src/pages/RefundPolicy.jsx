import React from "react";

export default function RefundPolicy() {
  const lastUpdated = "January 15, 2025";

  const containerStyle = {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "40px 20px",
    fontFamily: "Arial, sans-serif",
    lineHeight: "1.6",
    color: "#333",
  };

  const titleStyle = {
    fontSize: "2.5rem",
    fontWeight: "bold",
    marginBottom: "10px",
    color: "#003d3b",
    textAlign: "center",
  };

  const dateStyle = {
    textAlign: "center",
    color: "#666",
    marginBottom: "30px",
    fontSize: "0.9rem",
  };

  const sectionStyle = {
    marginBottom: "25px",
  };

  const headingStyle = {
    fontSize: "1.5rem",
    fontWeight: "600",
    marginBottom: "15px",
    color: "#00B5B8",
  };

  const paragraphStyle = {
    marginBottom: "15px",
    fontSize: "1rem",
  };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Refund Policy</h1>
      <p style={dateStyle}>Last Updated: {lastUpdated}</p>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>General Refund Policy</h2>
        <p style={paragraphStyle}>
          SEUMP is a crowdfunding and donation platform. Donations made through our platform are generally considered final and non-refundable, as they are contributions to support campaigns and causes.
        </p>
        <p style={paragraphStyle}>
          However, we understand that exceptional circumstances may arise. This policy outlines the conditions under which refunds may be considered.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>Eligible Refund Scenarios</h2>
        <p style={paragraphStyle}>
          <strong>1. Fraudulent Campaigns:</strong> If a campaign is determined to be fraudulent or violates our Terms and Conditions, refunds may be issued to donors upon investigation and verification.
        </p>
        <p style={paragraphStyle}>
          <strong>2. Technical Errors:</strong> In cases of technical errors resulting in duplicate charges or incorrect amounts, refunds will be processed promptly upon verification.
        </p>
        <p style={paragraphStyle}>
          <strong>3. Unauthorized Transactions:</strong> If you believe your account was used for an unauthorized donation, please contact us immediately. We will investigate and process refunds for verified unauthorized transactions.
        </p>
        <p style={paragraphStyle}>
          <strong>4. Campaign Cancellation:</strong> If a campaign creator cancels their campaign before funds are disbursed, donors may be eligible for refunds at the campaign creator's discretion or as required by applicable law.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>Non-Refundable Scenarios</h2>
        <p style={paragraphStyle}>
          Refunds will generally not be provided for:
        </p>
        <ul style={{ marginLeft: "30px", marginBottom: "15px" }}>
          <li style={{ marginBottom: "10px" }}>Change of mind after making a donation</li>
          <li style={{ marginBottom: "10px" }}>Campaign goals not being met (unless campaign is cancelled)</li>
          <li style={{ marginBottom: "10px" }}>Disagreement with how campaign funds are used (after disbursement)</li>
          <li style={{ marginBottom: "10px" }}>Platform fees (these are non-refundable)</li>
        </ul>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>Refund Process</h2>
        <p style={paragraphStyle}>
          To request a refund, please contact our support team with the following information:
        </p>
        <ul style={{ marginLeft: "30px", marginBottom: "15px" }}>
          <li style={{ marginBottom: "10px" }}>Donation receipt number or transaction ID</li>
          <li style={{ marginBottom: "10px" }}>Campaign name and ID</li>
          <li style={{ marginBottom: "10px" }}>Reason for refund request</li>
          <li style={{ marginBottom: "10px" }}>Supporting documentation (if applicable)</li>
        </ul>
        <p style={paragraphStyle}>
          Refund requests will be reviewed within 5-7 business days. Approved refunds will be processed to the original payment method within 10-14 business days.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>Platform Fees</h2>
        <p style={paragraphStyle}>
          Platform fees charged by SEUMP are non-refundable, even if a donation is refunded. These fees cover payment processing, platform maintenance, and operational costs.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>Disputed Transactions</h2>
        <p style={paragraphStyle}>
          If you dispute a transaction with your bank or credit card company, we will cooperate with the investigation. However, please note that chargebacks may result in account restrictions or suspension.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>Contact for Refunds</h2>
        <p style={paragraphStyle}>
          For refund requests or questions about this policy, please contact our support team through our contact form or email. Include your donation receipt number for faster processing.
        </p>
      </div>
    </div>
  );
}

