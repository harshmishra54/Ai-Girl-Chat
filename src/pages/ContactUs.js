import React from "react";

const ContactUs = () => {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Contact Us</h1>

      <p className="mb-6">
        We value your feedback and are here to help. For any inquiries, support requests, or suggestions regarding our services, please feel free to contact us using the information below.
      </p>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Customer Support Email</h2>
        <p>
          <a href="mailto:aigirl54329@gmail.com" className="text-blue-600 hover:underline">
            aigirl54329@gmail.com
          </a>
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Address</h2>
        <p>
          Ganesh Nagar, Khandwa Naka,<br />
          Indore, Madhya Pradesh - 452001<br />
          India
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Business Hours</h2>
        <p>Monday to Saturday: 10:00 AM – 6:00 PM IST<br />Sunday: Closed</p>
      </div>
    </div>
  );
};

export default ContactUs;
