import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p className="footer-text">
          © {new Date().getFullYear()} AI Girl Chat. All rights reserved.
        </p>

        <div className="footer-links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms & Conditions</Link>
          <Link to="/refund">Refund Policy</Link>
          <Link to="/contact">Contact Us</Link>
        </div>

        <div className="footer-business-info">
          <p><strong>Registered Business Name:</strong> AI Girl Chat Pvt Ltd</p>
          <p><strong>Address:</strong> Ganesh Nagar, Khandwa Naka, Indore, Madhya Pradesh, India</p>
          <p><strong>Email:</strong> aigirl54329@gmail.com</p>
          <p><strong>Phone:</strong> +91-8109315778</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
