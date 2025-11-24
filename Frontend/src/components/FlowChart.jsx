import React from "react";

export default function FlowChart() {
  const steps = [
    {
      id: 1,
      title: "Create Account",
      desc: "Sign up using email or mobile number.",
    },
    {
      id: 2,
      title: "Start a Fundraiser",
      desc: "Click the 'Start a Fundraiser' button.",
    },
    {
      id: 3,
      title: "Fill Campaign Details",
      desc: "Add story, images, documents, goal amount.",
    },
    {
      id: 4,
      title: "Admin Review",
      desc: "Admin verifies the authenticity of the campaign.",
    },
    {
      id: 5,
      title: "Campaign Approved",
      desc: "Once approved, your campaign goes live on SEUMP.",
    },
    {
      id: 6,
      title: "Receive Donations",
      desc: "Donors contribute to your cause securely.",
    },
  ];

  return (
    <div className="w-full max-w-md relative">
      {steps.map((step, index) => (
        <div key={step.id} className="relative">
          {/* Circle */}
          <div
            className="flex items-center gap-4 animate-fadeInUp"
            style={{ animationDelay: `${index * 0.25}s` }}
          >
            <div className="w-12 h-12 flex items-center justify-center bg-[#00B5B8] text-white text-lg font-bold rounded-full shadow-md">
              {step.id}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[#003D3B]">{step.title}</h3>
              <p className="text-gray-600 text-sm">{step.desc}</p>
            </div>
          </div>

          {/* Line connector except for last item */}
          {index < steps.length - 1 && (
            <div className="ml-6 h-10 border-l-2 border-[#00B5B8] my-1"></div>
          )}
        </div>
      ))}
    </div>
  );
}
