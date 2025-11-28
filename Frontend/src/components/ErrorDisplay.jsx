import React from "react";

export default function ErrorDisplay({ 
  error, 
  onRetry, 
  title = "Something went wrong",
  message = "We couldn't load this content. Please try again.",
  className = ""
}) {
  const errorMessage = error?.userMessage || error?.message || message;
  const status = error?.status;

  return (
    <div className={`bg-white rounded-2xl border border-red-200 p-8 text-center ${className}`}>
      <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      
      <h3 className="text-xl font-bold text-[#003d3b] mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{errorMessage}</p>
      
      {status && (
        <p className="text-sm text-gray-500 mb-4">
          Error Code: {status}
        </p>
      )}
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-[#00B5B8] text-white font-semibold rounded-xl hover:bg-[#009EA1] transition"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

