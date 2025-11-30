import React from "react";

export default function ShippingPolicy() {
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
      <h1 style={titleStyle}>Shipping Policy</h1>
      <p style={dateStyle}>Last Updated: {lastUpdated}</p>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>Digital Platform - No Physical Shipping</h2>
        <p style={paragraphStyle}>
          SEUMP is a crowdfunding and donation platform that facilitates financial contributions to various campaigns and causes. We do not sell, ship, or deliver any physical products or goods.
        </p>
        <p style={paragraphStyle}>
          All transactions on our platform are monetary donations made to support campaigns, fundraisers, and charitable causes. As such, there are no physical items to be shipped or delivered.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>Donation Receipts</h2>
        <p style={paragraphStyle}>
          Upon successful completion of a donation, donors will receive a digital receipt via email. This receipt serves as proof of your contribution and can be used for tax purposes where applicable.
        </p>
        <p style={paragraphStyle}>
          Receipts are generated automatically and sent to the email address associated with your donor account. If you do not receive your receipt, please check your spam folder or contact our support team.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>Campaign Updates</h2>
        <p style={paragraphStyle}>
          Campaign creators may provide updates about their fundraising progress, milestones achieved, and how funds are being utilized. These updates are delivered digitally through our platform and via email notifications.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>Contact Information</h2>
        <p style={paragraphStyle}>
          If you have any questions regarding this policy or need assistance with your donation, please contact us through our contact form or email support.
        </p>
      </div>
    </div>
  );
}

