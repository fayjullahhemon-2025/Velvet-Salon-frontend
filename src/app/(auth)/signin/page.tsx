import type { Metadata } from "next";
import { Suspense } from "react";
import SigninForm from "@/components/auth/SigninForm";

export const metadata: Metadata = {
  title: "Sign In | Velvet Saloon",
  description: "Sign in to your Velvet Saloon account.",
};

export default function SigninPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-bg-canvas text-xs text-fg-muted">
          Loading sign in…
        </div>
      }
    >
      <SigninForm />
    </Suspense>
  );
}
