import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Header.css";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <header className="header">
      <div className="header-container">
        <h1 className="logo">AI Girl Chat</h1>

        <button className="menu-toggle" onClick={toggleMenu}>
          ☰
        </button>

        <nav className={`nav-links ${isOpen ? "open" : ""}`}>
          <Link to="/privacy" onClick={toggleMenu}>Privacy Policy</Link>
          <Link to="/terms" onClick={toggleMenu}>Terms</Link>
          <Link to="/refund" onClick={toggleMenu}>Refund</Link>
          <Link to="/contact" onClick={toggleMenu}>Contact</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
