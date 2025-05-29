import React from "react";

const RefundPolicy = () => {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Refund Policy</h1>

      <p className="mb-4">
        We want you to be fully satisfied with your subscription to AI Girl Chat.
        If you're not satisfied, you may request a refund based on the conditions below.
      </p>

      <h2 className="text-xl font-semibold mt-4 mb-2">Eligibility</h2>
      <p className="mb-4">
        You are eligible for a full refund within the first few minutes of your payment
        if you have not excessively used or abused the AI chat service.
      </p>

      <h2 className="text-xl font-semibold mt-4 mb-2">How to Request a Refund</h2>
      <p className="mb-4">
        To initiate a refund, please email us at <strong>support@aigirlchat.com</strong> with
        your transaction ID and the reason for the refund request.
      </p>

      <h2 className="text-xl font-semibold mt-4 mb-2">Processing Time</h2>
      <p className="mb-4">
        If your refund is approved, the amount will be credited back to your original
        payment method within <strong>1 to 5 minutes</strong> of the request being processed.
      </p>

      <h2 className="text-xl font-semibold mt-4 mb-2">Contact</h2>
      <p>
        For questions or concerns regarding refunds, please reach out to us at{" "}
        <strong>support@aigirlchat.com</strong>.
      </p>
    </div>
  );
};

export default RefundPolicy;
