import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p className="footer-text">© {new Date().getFullYear()} AI Girl Chat. All rights reserved.</p>
        <div className="footer-links">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/refund">Refund</Link>
          <Link to="/contact">Contact</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
