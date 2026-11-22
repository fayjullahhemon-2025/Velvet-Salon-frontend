"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import GoogleButton from "@/components/auth/GoogleButton";
import PasswordInput from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signOut } from "@/lib/auth-client";
import {
  getAuthErrorMessage,
  getHomeForRole,
  isUserBlocked,
} from "@/lib/auth-helpers";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = {
  email?: string;
  password?: string;
};

export default function SigninForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [googlePending, setGooglePending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || googlePending) return;

    const errors: FieldErrors = {};
    if (!EMAIL_PATTERN.test(email.trim())) {
      errors.email = "Please enter a valid email address.";
    }
    if (!password) {
      errors.password = "Please enter your password.";
    }
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await signIn.email({
        email: email.trim(),
        password,
      });

      if (error) {
        toast.error(getAuthErrorMessage(error));
        return;
      }

      if (isUserBlocked(data?.user)) {
        await signOut();
        toast.error(
          "Your account is suspended. Please contact salon administration.",
        );
        return;
      }

      toast.success("Signed in successfully.");
      const defaultHome = getHomeForRole(data?.user);
      let targetUrl = defaultHome;

      // Handle dynamic post-login redirect for callback URLs (e.g. /services/[id])
      const rawCallback = searchParams?.get("callbackUrl");
      let cleanCallback: string | null = null;
      if (rawCallback) {
        try {
          cleanCallback = decodeURIComponent(rawCallback);
        } catch {
          cleanCallback = rawCallback;
        }
      }

      if (cleanCallback?.startsWith("/") && !cleanCallback.startsWith("//")) {
        const isAdminRoute =
          cleanCallback.startsWith("/dashboard/admin") ||
          cleanCallback.startsWith("/dashboard/manage-");
        const userIsAdmin = (data?.user as { role?: string })?.role === "admin";
        if (!isAdminRoute || userIsAdmin) {
          targetUrl = cleanCallback;
        }
      }

      // Hard redirect to ensure full page and session state sync across all components
      window.location.href = targetUrl;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    if (submitting || googlePending) return;
    setGooglePending(true);
    const callbackTarget = callbackUrl
      ? `/auth/redirect?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "/auth/redirect";

    const { error } = await signIn.social({
      provider: "google",
      callbackURL: callbackTarget,
    });
    if (error) {
      setGooglePending(false);
      toast.error(getAuthErrorMessage(error));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl text-fg-primary">Sign in</CardTitle>
        <CardDescription>
          Welcome back — sign in to manage your bookings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setFieldErrors((previous) => ({
                  ...previous,
                  email: undefined,
                }));
              }}
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.email) || undefined}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
            />
            {fieldErrors.email ? (
              <p id="email-error" className="text-xs text-destructive">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          <PasswordInput
            id="password"
            label="Password"
            value={password}
            onChange={(value) => {
              setPassword(value);
              setFieldErrors((previous) => ({
                ...previous,
                password: undefined,
              }));
            }}
            autoComplete="current-password"
            placeholder="Enter your password"
            disabled={submitting}
            error={fieldErrors.password}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={submitting || googlePending}
            aria-busy={submitting}
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            {submitting ? "Signing in…" : "Sign in"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border-subtle" />
            </div>
            <span className="relative mx-auto block w-fit bg-bg-surface-card px-3 text-xs text-fg-muted">
              or continue with
            </span>
          </div>

          <GoogleButton
            onClick={handleGoogle}
            pending={googlePending}
            disabled={submitting}
          />

          <p className="text-center text-sm text-fg-muted">
            New to Velvet Saloon?{" "}
            <Link
              href={
                callbackUrl
                  ? `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`
                  : "/signup"
              }
              className="font-medium text-fg-primary underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
