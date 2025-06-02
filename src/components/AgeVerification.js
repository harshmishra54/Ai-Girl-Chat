import React from "react";
import { useNavigate } from "react-router-dom";

const AgeVerification = () => {
  const navigate = useNavigate();

  const handleYes = () => {
    localStorage.setItem("ageVerified", "true");
    navigate("/"); // Redirect to home after verification
  };

  const handleNo = () => {
    alert("Sorry, you must be 18 or older to enter this site.");
    window.location.href = "https://www.google.com"; // Or any other site you want
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2>Age Verification</h2>
        <p>Are you 18 years old or older?</p>
        <div style={styles.buttons}>
          <button style={styles.buttonYes} onClick={handleYes}>Yes</button>
          <button style={styles.buttonNo} onClick={handleNo}>No</button>
        </div>
        <p style={styles.termsText}>
          By proceeding, you agree to our{" "}
          <a href="/terms" target="_blank" rel="noopener noreferrer" style={styles.link}>
            Terms and Conditions
          </a>.
        </p>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    height: "100vh",
    width: "100vw",
    backgroundColor: "rgba(0,0,0,0.8)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#fff",
    padding: "30px 40px",
    borderRadius: "8px",
    textAlign: "center",
    maxWidth: "400px",
    boxShadow: "0 0 15px rgba(0,0,0,0.3)",
  },
  buttons: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "space-around",
  },
  buttonYes: {
    padding: "10px 20px",
    backgroundColor: "#4CAF50",
    border: "none",
    borderRadius: "5px",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
  buttonNo: {
    padding: "10px 20px",
    backgroundColor: "#f44336",
    border: "none",
    borderRadius: "5px",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
  termsText: {
    marginTop: "20px",
    fontSize: "0.9rem",
    color: "#555",
  },
  link: {
    color: "#4CAF50",
    textDecoration: "underline",
    cursor: "pointer",
  },
};

export default AgeVerification;
