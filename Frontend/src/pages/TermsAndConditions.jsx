import React from "react";

export default function TermsAndConditions() {
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
      <h1 style={titleStyle}>Terms and Conditions</h1>
      <p style={dateStyle}>Last Updated: {lastUpdated}</p>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>1. Acceptance of Terms</h2>
        <p style={paragraphStyle}>
          By accessing and using SEUMP (the "Platform"), you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our platform.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>2. Platform Description</h2>
        <p style={paragraphStyle}>
          SEUMP is a crowdfunding and donation platform that connects donors with campaign creators seeking financial support for various causes, including medical expenses, education, disaster relief, and other charitable purposes.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>3. User Accounts</h2>
        <p style={paragraphStyle}>
          To create a campaign or make donations, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
        </p>
        <p style={paragraphStyle}>
          You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>4. Donations</h2>
        <p style={paragraphStyle}>
          All donations made through the Platform are voluntary contributions. Donations are processed through our secure payment gateway, and all transactions are final unless otherwise stated in our Refund Policy.
        </p>
        <p style={paragraphStyle}>
          Donors acknowledge that donations are made to support campaigns and causes, and that SEUMP acts as an intermediary platform facilitating these transactions.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>5. Campaign Creation</h2>
        <p style={paragraphStyle}>
          Campaign creators are responsible for the accuracy and truthfulness of all information provided in their campaigns. Campaigns must comply with all applicable laws and regulations.
        </p>
        <p style={paragraphStyle}>
          SEUMP reserves the right to review, approve, reject, or remove any campaign that violates our policies or applicable laws.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>6. Platform Fees</h2>
        <p style={paragraphStyle}>
          SEUMP charges a platform fee on donations to cover operational costs, payment processing, and platform maintenance. The fee structure is disclosed to donors before completing a donation.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>7. Prohibited Activities</h2>
        <p style={paragraphStyle}>
          Users are prohibited from: creating fraudulent campaigns, misrepresenting information, using the platform for illegal activities, harassing other users, or violating any applicable laws or regulations.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>8. Intellectual Property</h2>
        <p style={paragraphStyle}>
          All content on the Platform, including text, graphics, logos, and software, is the property of SEUMP or its content suppliers and is protected by copyright and other intellectual property laws.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>9. Limitation of Liability</h2>
        <p style={paragraphStyle}>
          SEUMP acts as an intermediary platform and is not responsible for the actions of campaign creators or the use of funds raised through campaigns. We do not guarantee the success of any campaign or the fulfillment of campaign goals.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>10. Modifications to Terms</h2>
        <p style={paragraphStyle}>
          SEUMP reserves the right to modify these Terms and Conditions at any time. Users will be notified of significant changes, and continued use of the Platform constitutes acceptance of the modified terms.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>11. Contact Information</h2>
        <p style={paragraphStyle}>
          For questions about these Terms and Conditions, please contact us through our contact form or email support.
        </p>
      </div>
    </div>
  );
}

