import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SignUp, useAuth } from "@clerk/clerk-react";

export default function DonorSignUp() {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    // If already signed in, redirect to success page immediately
    if (isSignedIn) {
      navigate("/auth/google/success");
    }
  }, [isSignedIn, navigate]);

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 bg-[#F1FAFA]">
      <div className="w-full max-w-md">
        <SignUp
          path="/donor/sign-up"
          routing="path"
          afterSignUpUrl="/auth/google/success"
          redirectUrl="/auth/google/success"
          signUpFallbackRedirectUrl="/auth/google/success"
        />
      </div>
    </div>
  );
}

