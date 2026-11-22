import type { Metadata } from "next";
import SigninForm from "@/components/auth/SigninForm";

export const metadata: Metadata = {
  title: "Sign In | Velvet Saloon",
  description: "Sign in to your Velvet Saloon account.",
};

export default function SigninPage() {
  return <SigninForm />;
}
