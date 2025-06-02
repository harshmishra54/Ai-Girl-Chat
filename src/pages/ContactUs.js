import React from "react";

const ContactUs = () => {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Contact Us</h1>

      <p className="mb-6">
        We welcome your questions, suggestions, or concerns regarding our service. Please don’t hesitate to get in touch — we’re here to assist you.
      </p>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Email</h2>
        <p>
          <a href="mailto:support@aigirlchat.com" className="text-blue-600 hover:underline">
            support@aigirlchat.com
          </a>
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Office Address</h2>
        <p>
          Ganesh Nagar, Khandwa Naka,<br />
          Indore, Madhya Pradesh,<br />
          India
        </p>
      </div>
    </div>
  );
};

export default ContactUs;
