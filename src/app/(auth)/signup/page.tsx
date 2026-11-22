import type { Metadata } from "next";
import { Suspense } from "react";
import SignupForm from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Sign Up | Velvet Saloon",
  description: "Create your Velvet Saloon account to book salon services.",
};

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-bg-canvas text-xs text-fg-muted">
          Loading sign up…
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
