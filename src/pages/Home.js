import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import Header from "../components/Header"; 
import Footer from "../components/Footer";

// Import your local image
import Bot from "../assets/images/Bot.jpg";

const Home = () => {
  const navigate = useNavigate();

  const aiGirl = {
    name: "Sofia",
    bio: "Hey there! I'm Sofia 💕 Your virtual crush here to chat, flirt & have fun 😉",
    image: Bot,  // use imported image here
  };

  return (
    <>
      <Header />
      <div className="home-container">
        <h1>💖 Welcome to AI Girl Chat 💖</h1>

        <div className="profile-card">
          <img src={aiGirl.image} alt={aiGirl.name} className="ai-image" />
          <h2>{aiGirl.name}</h2>
          <p>{aiGirl.bio}</p>

          <button onClick={() => navigate("/login")} className="chat-btn">
            Chat with Me 💬
          </button>

          <p>
            New here?{" "}
            <span onClick={() => navigate("/signup")} className="signup-link">
              Create an account
            </span>
          </p>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Home;
