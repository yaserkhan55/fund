// SignUpHeader.jsx - Shows which option user selected
import { useEffect, useState } from "react";

export default function SignUpHeader() {
  const [userFlow, setUserFlow] = useState(null);

  useEffect(() => {
    const flow = sessionStorage.getItem("userFlow");
    setUserFlow(flow);
  }, []);

  if (!userFlow) return null;

  return (
    <div className="mb-6 p-4 bg-[#E6F7F7] rounded-lg border border-[#00B5B8]">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-[#00B5B8] rounded-full flex items-center justify-center">
          {userFlow === "donor" ? (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#003D3B]">
            {userFlow === "donor" 
              ? "You're signing up as a Donor" 
              : "You're signing up as a Campaign Creator"}
          </p>
          <p className="text-xs text-gray-600">
            {userFlow === "donor"
              ? "You'll be able to donate to campaigns"
              : "You'll be able to create and manage fundraisers"}
          </p>
        </div>
      </div>
    </div>
  );
}

