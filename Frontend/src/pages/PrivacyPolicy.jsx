import React from "react";

export default function PrivacyPolicy() {
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
      <h1 style={titleStyle}>Privacy Policy</h1>
      <p style={dateStyle}>Last Updated: {lastUpdated}</p>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>1. Introduction</h2>
        <p style={paragraphStyle}>
          SEUMP ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our crowdfunding and donation platform.
        </p>
        <p style={paragraphStyle}>
          By using our platform, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our services.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>2. Information We Collect</h2>
        <p style={paragraphStyle}>
          <strong>Personal Information:</strong> We collect information that you provide directly to us, including:
        </p>
        <ul style={{ marginLeft: "30px", marginBottom: "15px" }}>
          <li style={{ marginBottom: "10px" }}>Name, email address, and phone number</li>
          <li style={{ marginBottom: "10px" }}>Payment information (processed securely through payment gateways)</li>
          <li style={{ marginBottom: "10px" }}>Account credentials and profile information</li>
          <li style={{ marginBottom: "10px" }}>Campaign information and content you create</li>
          <li style={{ marginBottom: "10px" }}>Donation history and transaction records</li>
        </ul>
        <p style={paragraphStyle}>
          <strong>Automatically Collected Information:</strong> We may collect certain information automatically when you use our platform, including:
        </p>
        <ul style={{ marginLeft: "30px", marginBottom: "15px" }}>
          <li style={{ marginBottom: "10px" }}>IP address and device information</li>
          <li style={{ marginBottom: "10px" }}>Browser type and version</li>
          <li style={{ marginBottom: "10px" }}>Usage data and interaction patterns</li>
          <li style={{ marginBottom: "10px" }}>Cookies and similar tracking technologies</li>
        </ul>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>3. How We Use Your Information</h2>
        <p style={paragraphStyle}>
          We use the information we collect for various purposes, including:
        </p>
        <ul style={{ marginLeft: "30px", marginBottom: "15px" }}>
          <li style={{ marginBottom: "10px" }}>To provide, maintain, and improve our services</li>
          <li style={{ marginBottom: "10px" }}>To process donations and transactions</li>
          <li style={{ marginBottom: "10px" }}>To verify user identity and prevent fraud</li>
          <li style={{ marginBottom: "10px" }}>To send transaction receipts and notifications</li>
          <li style={{ marginBottom: "10px" }}>To communicate with you about your account and campaigns</li>
          <li style={{ marginBottom: "10px" }}>To comply with legal obligations</li>
          <li style={{ marginBottom: "10px" }}>To analyze platform usage and improve user experience</li>
        </ul>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>4. Information Sharing and Disclosure</h2>
        <p style={paragraphStyle}>
          We do not sell your personal information. We may share your information only in the following circumstances:
        </p>
        <p style={paragraphStyle}>
          <strong>Service Providers:</strong> We may share information with third-party service providers who perform services on our behalf, such as payment processing, email delivery, and data analytics.
        </p>
        <p style={paragraphStyle}>
          <strong>Legal Requirements:</strong> We may disclose information if required by law, court order, or government regulation, or to protect our rights and the safety of our users.
        </p>
        <p style={paragraphStyle}>
          <strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.
        </p>
        <p style={paragraphStyle}>
          <strong>With Your Consent:</strong> We may share information with your explicit consent or at your direction.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>5. Data Security</h2>
        <p style={paragraphStyle}>
          We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure.
        </p>
        <p style={paragraphStyle}>
          We use industry-standard encryption for sensitive data, secure payment processing, and regular security assessments to maintain the integrity of our platform.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>6. Cookies and Tracking Technologies</h2>
        <p style={paragraphStyle}>
          We use cookies and similar tracking technologies to track activity on our platform and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our platform.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>7. Your Rights and Choices</h2>
        <p style={paragraphStyle}>
          Depending on your location, you may have certain rights regarding your personal information, including:
        </p>
        <ul style={{ marginLeft: "30px", marginBottom: "15px" }}>
          <li style={{ marginBottom: "10px" }}>Right to access your personal information</li>
          <li style={{ marginBottom: "10px" }}>Right to correct inaccurate information</li>
          <li style={{ marginBottom: "10px" }}>Right to delete your information</li>
          <li style={{ marginBottom: "10px" }}>Right to object to processing of your information</li>
          <li style={{ marginBottom: "10px" }}>Right to data portability</li>
          <li style={{ marginBottom: "10px" }}>Right to withdraw consent</li>
        </ul>
        <p style={paragraphStyle}>
          To exercise these rights, please contact us through our contact form or email support.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>8. Data Retention</h2>
        <p style={paragraphStyle}>
          We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. Transaction records may be retained for accounting and legal compliance purposes.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>9. Children's Privacy</h2>
        <p style={paragraphStyle}>
          Our platform is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>10. International Data Transfers</h2>
        <p style={paragraphStyle}>
          Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from those in your country. By using our platform, you consent to the transfer of your information to these countries.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>11. Changes to This Privacy Policy</h2>
        <p style={paragraphStyle}>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>12. Contact Us</h2>
        <p style={paragraphStyle}>
          If you have any questions about this Privacy Policy or our data practices, please contact us through our contact form or email support.
        </p>
      </div>
    </div>
  );
}

