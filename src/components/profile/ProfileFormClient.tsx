"use client";

import {
  Camera,
  CheckCircle2,
  Globe,
  Loader2,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  Upload,
  User,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { updateUserProfileAction } from "@/lib/actions/users";
import { updateUser } from "@/lib/auth-client";
import { getTokenFromClient } from "@/lib/getTokenFromClient";
import type { UserProfile } from "@/types/user";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

interface ProfileFormClientProps {
  initialProfile: UserProfile;
  roleTitle?: string;
}

export function ProfileFormClient({
  initialProfile,
  roleTitle,
}: ProfileFormClientProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>(initialProfile);

  // Form states
  const [name, setName] = useState(profile.name || "");
  const [phone, setPhone] = useState(profile.phone || "");

  // Image states: supports file upload (ImgBB) or direct image URL
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
  const [imageUrl, setImageUrl] = useState(profile.image || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(profile.image || "");
  const [uploadingImage, setUploadingImage] = useState(false);

  const [isPending, startTransition] = useTransition();

  // Handle local file selection for ImgBB upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a valid image file (JPG, PNG, GIF, or WebP).");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Profile image must be smaller than 10MB.");
      return;
    }

    setImageFile(file);
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);

    // Auto-upload to ImgBB
    setUploadingImage(true);
    try {
      const uploadBody = new FormData();
      uploadBody.append("image", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadBody,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success || typeof data.url !== "string") {
        throw new Error(data?.error || "Image upload failed.");
      }

      setImageUrl(data.url);
      setImagePreview(data.url);
      toast.success("Profile photo uploaded to ImgBB successfully!");
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Failed to upload image.";
      toast.error(msg);
      // Revert preview on failure
      setImagePreview(imageUrl || profile.image || "");
      setImageFile(null);
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle direct image URL input
  const handleUrlChange = (val: string) => {
    setImageUrl(val);
    setImagePreview(val);
  };

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Full Name cannot be empty.");
      return;
    }

    startTransition(async () => {
      try {
        const clientToken = await getTokenFromClient().catch(() => undefined);
        const finalImage = imageUrl.trim() || "";

        // Update Better Auth client session so Navbar useSession() immediately reflects the new name/image
        try {
          await updateUser({
            name: name.trim(),
            ...(finalImage ? { image: finalImage } : {}),
          });
        } catch (authErr) {
          console.warn("Better Auth client updateUser notice:", authErr);
        }

        const result = await updateUserProfileAction({
          name: name.trim(),
          image: finalImage,
          phone: phone.trim(),
          token: clientToken,
        });

        if (result?.success) {
          toast.success(result.message || "Profile updated successfully!");
          if (result.data) {
            setProfile(result.data);
            setName(result.data.name);
            setPhone(result.data.phone || "");
            setImageUrl(result.data.image || "");
            setImagePreview(result.data.image || "");
          }
          router.refresh();
        }
      } catch (error) {
        const msg =
          error instanceof Error
            ? error.message
            : "Failed to update profile. Please try again.";
        toast.error(msg);
      }
    });
  };

  const handleReset = () => {
    setName(profile.name || "");
    setPhone(profile.phone || "");
    setImageUrl(profile.image || "");
    setImagePreview(profile.image || "");
    setImageFile(null);
    toast.info("Profile changes reverted.");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg-primary sm:text-3xl flex items-center gap-2">
          <User className="size-7 text-bg-accent-brand" />
          {roleTitle || "My Profile"}
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          Manage your personal information, profile photo, and contact details.
        </p>
      </div>

      {/* Profile Overview Card */}
      <Card className="border-border-subtle bg-bg-surface-card shadow-xs overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-bg-surface-dark via-bg-surface-dark/90 to-bg-accent-brand/40" />
        <CardContent className="p-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-10 mb-4">
            {/* Avatar */}
            <div className="relative size-24 rounded-2xl border-4 border-bg-surface-card bg-bg-canvas overflow-hidden shadow-md shrink-0">
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt={name || "User Avatar"}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-bg-canvas text-fg-muted font-bold text-2xl uppercase">
                  {(name || profile.name || "U")[0]}
                </div>
              )}
              {uploadingImage ? (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-xs">
                  <Loader2 className="size-6 text-white animate-spin" />
                </div>
              ) : null}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={`text-xs font-semibold px-3 py-1 ${
                  profile.role === "admin"
                    ? "bg-bg-surface-dark text-white border border-border-subtle"
                    : "bg-bg-accent-brand text-fg-on-accent"
                }`}
              >
                <ShieldCheck className="size-3.5 mr-1" />
                {profile.role.toUpperCase()}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs font-semibold px-3 py-1 ${
                  profile.isBlocked
                    ? "border-red-600 text-red-600 bg-red-50"
                    : "border-emerald-600 text-emerald-600 bg-emerald-50"
                }`}
              >
                <CheckCircle2 className="size-3.5 mr-1" />
                {profile.isBlocked ? "SUSPENDED" : "ACTIVE"}
              </Badge>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-fg-primary">
              {name || profile.name}
            </h2>
            <p className="text-xs text-fg-muted flex items-center gap-1.5 mt-0.5">
              <Mail className="size-3 text-fg-muted" />
              {profile.email}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Form */}
      <Card className="border-border-subtle bg-bg-surface-card shadow-xs">
        <CardHeader className="p-6 pb-4 border-b border-border-subtle">
          <CardTitle className="text-lg font-bold text-fg-primary">
            Edit Profile Information
          </CardTitle>
          <CardDescription className="text-xs text-fg-muted">
            Update your full name, profile image (via upload or URL), and
            contact number.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <Label
                htmlFor="fullName"
                className="text-xs font-semibold text-fg-primary"
              >
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="mt-1 text-xs"
              />
              <span className="mt-1 block text-[11px] text-fg-muted">
                This is the name displayed across your bookings and account
                records.
              </span>
            </div>

            {/* Profile Image (File Upload or Image URL) */}
            <div className="space-y-3 rounded-xl border border-border-subtle bg-bg-canvas/30 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <Label className="text-xs font-semibold text-fg-primary">
                  Profile Photo (Image Upload or Image URL)
                </Label>
                {/* Mode Selector */}
                <div className="flex items-center gap-1 bg-bg-surface-card rounded-lg border border-border-subtle p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setImageMode("upload")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors ${
                      imageMode === "upload"
                        ? "bg-bg-accent-brand text-fg-on-accent shadow-xs"
                        : "text-fg-muted hover:text-fg-primary"
                    }`}
                  >
                    <Upload className="size-3" />
                    <span>Upload File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode("url")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors ${
                      imageMode === "url"
                        ? "bg-bg-accent-brand text-fg-on-accent shadow-xs"
                        : "text-fg-muted hover:text-fg-primary"
                    }`}
                  >
                    <Globe className="size-3" />
                    <span>Image URL</span>
                  </button>
                </div>
              </div>

              {/* Mode: File Upload (ImgBB) */}
              {imageMode === "upload" ? (
                <div>
                  <label
                    htmlFor="profilePhotoFile"
                    className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-subtle bg-bg-surface-card p-6 text-center hover:border-bg-accent-brand cursor-pointer transition-colors"
                  >
                    <Camera className="size-8 text-fg-muted mb-2" />
                    <span className="text-xs font-semibold text-fg-primary">
                      {imageFile
                        ? imageFile.name
                        : "Click to upload an image from your device"}
                    </span>
                    <span className="text-[11px] text-fg-muted mt-1">
                      PNG, JPG, GIF or WebP up to 10MB (automatically uploaded
                      to ImgBB)
                    </span>
                    <input
                      id="profilePhotoFile"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {uploadingImage ? (
                    <div className="flex items-center justify-center gap-2 mt-2 text-xs text-bg-accent-brand">
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Uploading photo to ImgBB…</span>
                    </div>
                  ) : null}
                </div>
              ) : (
                /* Mode: Image URL */
                <div>
                  <Input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="text-xs"
                  />
                  <span className="mt-1 block text-[11px] text-fg-muted">
                    Paste an image URL directly to set as your profile avatar.
                  </span>
                </div>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <Label
                htmlFor="phone"
                className="text-xs font-semibold text-fg-primary flex items-center gap-1"
              >
                <Phone className="size-3 text-fg-muted" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="mt-1 text-xs"
              />
              <span className="mt-1 block text-[11px] text-fg-muted">
                Used by salon coordinators for appointment confirmations and
                reminders.
              </span>
            </div>

            {/* Read-Only Account Security Guardrails */}
            <div className="rounded-xl border border-border-subtle bg-bg-canvas/50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-fg-muted">
                <Lock className="size-3.5" />
                <span>Protected Account Credentials & Access Levels</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Email (Read Only) */}
                <div>
                  <Label className="text-[11px] text-fg-muted">
                    Email Address (Account Login)
                  </Label>
                  <Input
                    type="email"
                    value={profile.email}
                    disabled
                    className="mt-1 text-xs bg-bg-surface-card/60 cursor-not-allowed opacity-80"
                  />
                  <span className="text-[10px] text-fg-muted mt-0.5 block">
                    Email cannot be altered through profile updates.
                  </span>
                </div>

                {/* Role (Read Only) */}
                <div>
                  <Label className="text-[11px] text-fg-muted">
                    Assigned Account Role
                  </Label>
                  <div className="mt-1 flex items-center h-9 px-3 rounded-md border border-border-subtle bg-bg-surface-card/60 text-xs font-semibold text-fg-primary capitalize">
                    {profile.role}
                  </div>
                  <span className="text-[10px] text-fg-muted mt-0.5 block">
                    Role changes are strictly restricted to system
                    administration.
                  </span>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border-subtle">
              <Button
                type="button"
                variant="outline"
                disabled={isPending || uploadingImage}
                onClick={handleReset}
                className="border-border-subtle text-fg-primary text-xs"
              >
                <RefreshCw className="size-3.5 mr-1.5" />
                Revert Changes
              </Button>
              <Button
                type="submit"
                disabled={isPending || uploadingImage}
                className="bg-bg-accent-brand text-fg-on-accent hover:opacity-90 font-semibold text-xs px-5"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                    Saving Changes…
                  </>
                ) : (
                  "Save Profile Changes"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
