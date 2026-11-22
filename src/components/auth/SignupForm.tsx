"use client";

import { cn } from "cn";
import {
  AlertCircle,
  Link as LinkIcon,
  Loader2,
  Upload,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import GoogleButton from "@/components/auth/GoogleButton";
import PasswordInput from "@/components/auth/PasswordInput";
import PasswordRules from "@/components/auth/PasswordRules";
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
import { signIn, signOut, signUp } from "@/lib/auth-client";
import {
  getAuthErrorMessage,
  getHomeForRole,
  isUserBlocked,
} from "@/lib/auth-helpers";
import { isStrongPassword } from "@/lib/password";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_PATTERN = /^https?:\/\/.+/i;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

type ImageMode = "upload" | "url";

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  image?: string;
};

type UploadResponse = {
  success?: boolean;
  url?: string;
  error?: string;
};

export default function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [imageMode, setImageMode] = useState<ImageMode>("upload");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [urlPreviewValid, setUrlPreviewValid] = useState(true);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [googlePending, setGooglePending] = useState(false);

  // Clean up object URL when component unmounts or file preview changes
  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  const handleImageFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a valid image file (JPG, PNG, GIF or WebP).");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Profile image must be smaller than 10MB.");
      return;
    }

    if (filePreview) URL.revokeObjectURL(filePreview);
    setImageFile(file);
    setFilePreview(URL.createObjectURL(file));
    setFieldErrors((prev) => ({ ...prev, image: undefined }));
  };

  const handleImageUrlChange = (url: string) => {
    setImageUrl(url);
    setUrlPreviewValid(true);
    setFieldErrors((prev) => ({ ...prev, image: undefined }));
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};

    if (name.trim().length < 2) {
      errors.name = "Please enter your full name (at least 2 characters).";
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (!isStrongPassword(password)) {
      errors.password = "Password does not meet the requirements below.";
    }

    if (imageMode === "upload") {
      if (!imageFile) {
        errors.image = "Please select a profile image to upload.";
      }
    } else {
      if (!imageUrl.trim()) {
        errors.image = "Please provide a valid image URL.";
      } else if (!URL_PATTERN.test(imageUrl.trim())) {
        errors.image = "Image URL must start with http:// or https://";
      }
    }

    return errors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || googlePending) return;

    const errors = validate();
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      toast.error("Please resolve the highlighted form errors.");
      return;
    }

    setSubmitting(true);
    try {
      let finalImageUrl = imageUrl.trim();

      // If user uploaded a local file, upload it via /api/upload (ImgBB)
      if (imageMode === "upload" && imageFile) {
        const uploadBody = new FormData();
        uploadBody.append("image", imageFile);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadBody,
        });

        const uploadData: UploadResponse | null = await uploadResponse
          .json()
          .catch(() => null);

        if (
          !uploadResponse.ok ||
          !uploadData?.success ||
          typeof uploadData.url !== "string"
        ) {
          throw new Error(
            uploadData?.error ?? "Image upload failed. Please try again.",
          );
        }

        finalImageUrl = uploadData.url;
      }

      // Execute signup with Better Auth
      const { data, error } = await signUp.email({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        image: finalImageUrl || undefined,
      });

      if (error) {
        toast.error(getAuthErrorMessage(error));
        return;
      }

      // Verify that user is not blocked
      if (isUserBlocked(data?.user)) {
        await signOut();
        toast.error(
          "Your account is suspended. Please contact salon administration.",
        );
        return;
      }

      toast.success("Account created successfully. Welcome to Velvet Saloon!");
      router.push(getHomeForRole(data?.user));
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong while creating your account. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    if (submitting || googlePending) return;
    setGooglePending(true);
    const { error } = await signIn.social({
      provider: "google",
      callbackURL: "/auth/redirect",
    });
    if (error) {
      setGooglePending(false);
      toast.error(getAuthErrorMessage(error));
    }
  };

  // Determine which preview to show
  const activePreview =
    imageMode === "upload"
      ? filePreview
      : imageUrl.trim() && urlPreviewValid
        ? imageUrl.trim()
        : null;

  return (
    <Card className="border-border-subtle bg-bg-surface-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl text-fg-primary">
          Create your account
        </CardTitle>
        <CardDescription className="text-fg-muted">
          Join Velvet Saloon to browse services and book appointments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-fg-primary">
              Full name
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setFieldErrors((prev) => ({ ...prev, name: undefined }));
              }}
              disabled={submitting || googlePending}
              aria-invalid={Boolean(fieldErrors.name) || undefined}
              aria-describedby={fieldErrors.name ? "name-error" : undefined}
            />
            {fieldErrors.name ? (
              <p
                id="name-error"
                className="flex items-center gap-1 text-xs text-destructive"
              >
                <AlertCircle className="size-3.5 shrink-0" aria-hidden />
                {fieldErrors.name}
              </p>
            ) : null}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-fg-primary">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }}
              disabled={submitting || googlePending}
              aria-invalid={Boolean(fieldErrors.email) || undefined}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
            />
            {fieldErrors.email ? (
              <p
                id="email-error"
                className="flex items-center gap-1 text-xs text-destructive"
              >
                <AlertCircle className="size-3.5 shrink-0" aria-hidden />
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <PasswordInput
              id="password"
              label="Password"
              value={password}
              onChange={(value) => {
                setPassword(value);
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }}
              autoComplete="new-password"
              placeholder="Choose a secure password"
              disabled={submitting || googlePending}
              error={fieldErrors.password}
            />
            <PasswordRules password={password} />
          </div>

          {/* Profile Image (Upload or URL) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-fg-primary">Profile image</Label>
              <div className="flex rounded-md border border-border-subtle p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setImageMode("upload");
                    setFieldErrors((prev) => ({ ...prev, image: undefined }));
                  }}
                  className={cn(
                    "flex items-center gap-1 rounded px-2 py-1 transition-colors",
                    imageMode === "upload"
                      ? "bg-bg-accent-brand text-fg-on-accent font-medium"
                      : "text-fg-muted hover:text-fg-primary",
                  )}
                  disabled={submitting || googlePending}
                >
                  <Upload className="size-3" aria-hidden />
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImageMode("url");
                    setFieldErrors((prev) => ({ ...prev, image: undefined }));
                  }}
                  className={cn(
                    "flex items-center gap-1 rounded px-2 py-1 transition-colors",
                    imageMode === "url"
                      ? "bg-bg-accent-brand text-fg-on-accent font-medium"
                      : "text-fg-muted hover:text-fg-primary",
                  )}
                  disabled={submitting || googlePending}
                >
                  <LinkIcon className="size-3" aria-hidden />
                  Image URL
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-subtle bg-bg-canvas">
                {activePreview ? (
                  <Image
                    src={activePreview}
                    alt="Selected profile preview"
                    width={56}
                    height={56}
                    unoptimized
                    onError={() => setUrlPreviewValid(false)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="size-6 text-fg-muted" aria-hidden />
                )}
              </div>

              {imageMode === "upload" ? (
                <div className="flex-1 space-y-1">
                  <Input
                    id="image"
                    name="image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageFileChange}
                    disabled={submitting || googlePending}
                    aria-invalid={Boolean(fieldErrors.image) || undefined}
                    aria-describedby={
                      fieldErrors.image ? "image-error" : undefined
                    }
                  />
                  <p className="text-xs text-fg-muted">
                    JPG, PNG or WebP up to 10MB — uploaded securely to ImgBB.
                  </p>
                </div>
              ) : (
                <div className="flex-1 space-y-1">
                  <Input
                    id="imageUrl"
                    name="imageUrl"
                    type="url"
                    placeholder="https://example.com/profile.jpg"
                    value={imageUrl}
                    onChange={(event) =>
                      handleImageUrlChange(event.target.value)
                    }
                    disabled={submitting || googlePending}
                    aria-invalid={Boolean(fieldErrors.image) || undefined}
                    aria-describedby={
                      fieldErrors.image ? "image-error" : undefined
                    }
                  />
                  <p className="text-xs text-fg-muted">
                    Paste a direct image link (https://).
                  </p>
                </div>
              )}
            </div>

            {fieldErrors.image ? (
              <p
                id="image-error"
                className="flex items-center gap-1 text-xs text-destructive"
              >
                <AlertCircle className="size-3.5 shrink-0" aria-hidden />
                {fieldErrors.image}
              </p>
            ) : null}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-bg-accent-brand text-fg-on-accent hover:opacity-90 font-medium transition-opacity"
            disabled={submitting || googlePending}
            aria-busy={submitting}
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin mr-2" aria-hidden />
            ) : null}
            {submitting ? "Creating account…" : "Create account"}
          </Button>

          {/* Social Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border-subtle" />
            </div>
            <span className="relative mx-auto block w-fit bg-bg-surface-card px-3 text-xs text-fg-muted">
              or continue with
            </span>
          </div>

          {/* Google Button */}
          <GoogleButton
            onClick={handleGoogle}
            pending={googlePending}
            disabled={submitting}
          />

          {/* Sign In Link */}
          <p className="text-center text-sm text-fg-muted">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="font-medium text-fg-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
