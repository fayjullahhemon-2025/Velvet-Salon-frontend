import type { Metadata } from "next";
import SignupForm from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Sign Up | Velvet Saloon",
  description: "Create your Velvet Saloon account to book salon services.",
};

export default function SignupPage() {
  return <SignupForm />;
}
