import React from "react";

const RefundPolicy = () => {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Refund Policy</h1>

      <p className="mb-6">
        At <strong>AI Girl Chat</strong>, we are committed to delivering a premium AI chat experience. Since our services are delivered instantly through digital interactions with the AI bot, we follow a strict but fair refund policy.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-3">Refund Eligibility</h2>
      <p className="mb-6">
        Users are eligible for a <strong>full refund within 5 minutes</strong> of successful payment, provided:
        <ul className="list-disc list-inside mt-2">
          <li>The AI chat service has not been extensively used or abused</li>
          <li>The request is made within the 5-minute time window</li>
        </ul>
        After 5 minutes of activation or use, the service is considered consumed and is <strong>non-refundable</strong>.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-3">Non-Refundable Scenarios</h2>
      <p className="mb-6">
        Refunds will not be issued under the following circumstances:
        <ul className="list-disc list-inside mt-2">
          <li>Refund request made after 5 minutes of purchase</li>
          <li>Service has been used beyond the initial trial message/session</li>
          <li>Repeated misuse of the refund policy</li>
        </ul>
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-3">How to Request a Refund</h2>
      <p className="mb-6">
        To request a refund, email us at <strong>aigirl54329@gmail.com</strong> within 5 minutes of your payment. Include the following details:
        <ul className="list-disc list-inside mt-2">
          <li>Transaction ID or payment receipt</li>
          <li>Date and time of purchase</li>
          <li>Reason for the refund</li>
        </ul>
        Our team will assess the request based on eligibility and usage.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-3">Refund Timeline</h2>
      <p className="mb-6">
        Once approved, your refund will be processed within <strong>1 to 5 business days</strong> and credited back to your original payment method. Processing time may vary based on your payment provider or bank.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-3">Contact Us</h2>
      <p>
        For questions regarding this Refund Policy, contact us at:<br />
        <strong>Email:</strong> aigirl54329@gmail.com
      </p>
    </div>
  );
};

export default RefundPolicy;
