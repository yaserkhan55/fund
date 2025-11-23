import { SignIn } from "@clerk/clerk-react";

export default function SignInPage() {
  return (
    <div className="w-full flex justify-center py-12 min-h-[70vh] bg-[#f9f5e7]">
      <div className="mt-10">
        <SignIn routing="path" path="/sign-in" />
      </div>
    </div>
  );
}
