"use client";

import { AlertCircle, ImagePlus, Loader2, UploadCloud } from "lucide-react";
import Image from "next/image";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createService, updateService } from "@/lib/actions/services";
import { getTokenFromClient } from "@/lib/getTokenFromClient";
import {
  SERVICE_CATEGORIES,
  type Service,
  type ServiceStatus,
} from "@/types/service";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceToEdit?: Service | null;
  onSuccess?: () => void;
}

export function ServiceFormDialog({
  open,
  onOpenChange,
  serviceToEdit,
  onSuccess,
}: ServiceFormDialogProps) {
  const isEditing = Boolean(serviceToEdit);

  const [serviceName, setServiceName] = useState("");
  const [category, setCategory] = useState<string>(SERVICE_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [status, setStatus] = useState<ServiceStatus>("active");

  // Image Upload State (Strictly file upload, not raw URL input)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Sync state when editing service changes
  useEffect(() => {
    if (serviceToEdit) {
      setServiceName(serviceToEdit.serviceName);
      setCategory(serviceToEdit.category || SERVICE_CATEGORIES[0]);
      setDescription(serviceToEdit.description);
      setPrice(String(serviceToEdit.price));
      setDuration(String(serviceToEdit.duration));
      setStatus(serviceToEdit.status || "active");
      setImagePreview(serviceToEdit.image || null);
      setImageFile(null);
    } else {
      setServiceName("");
      setCategory(SERVICE_CATEGORIES[0]);
      setDescription("");
      setPrice("");
      setDuration("");
      setStatus("active");
      setImagePreview(null);
      setImageFile(null);
    }
    setFieldErrors({});
  }, [serviceToEdit]);

  // Clean up object preview URL
  useEffect(() => {
    return () => {
      if (imagePreview && imageFile) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview, imageFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a valid image file (JPG, PNG, GIF or WebP).");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Service image must be smaller than 10MB.");
      return;
    }

    if (imagePreview && imageFile) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setFieldErrors((prev) => ({ ...prev, image: "" }));
  };

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!serviceName.trim()) {
      errors.serviceName = "Service Name is required.";
    }
    if (!category.trim()) {
      errors.category = "Please select a category.";
    }
    if (!description.trim()) {
      errors.description = "Service description is required.";
    }

    const numPrice = Number(price);
    if (!price || Number.isNaN(numPrice) || numPrice <= 0) {
      errors.price = "Price must be a positive number greater than 0.";
    }

    const numDuration = Number(duration);
    if (!duration || Number.isNaN(numDuration) || numDuration <= 0) {
      errors.duration = "Duration must be a positive integer in minutes.";
    }

    if (!imagePreview && !imageFile) {
      errors.image = "Please upload a service image.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting || uploadingImage) return;

    if (!validate()) {
      toast.error("Please fix the highlighted errors.");
      return;
    }

    setSubmitting(true);
    try {
      let finalImageUrl = imagePreview || "";

      // If a new file was chosen, upload via /api/upload (ImgBB)
      if (imageFile) {
        setUploadingImage(true);
        const uploadBody = new FormData();
        uploadBody.append("image", imageFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadBody,
        });

        const uploadData = await uploadRes.json().catch(() => null);
        if (
          !uploadRes.ok ||
          !uploadData?.success ||
          typeof uploadData.url !== "string"
        ) {
          throw new Error(
            uploadData?.error ?? "Image upload failed. Please try again.",
          );
        }
        finalImageUrl = uploadData.url;
        setUploadingImage(false);
      }

      const payload = {
        serviceName: serviceName.trim(),
        category: category.trim(),
        description: description.trim(),
        price: Number(price),
        duration: Math.round(Number(duration)),
        image: finalImageUrl,
        status,
      };

      const token = await getTokenFromClient().catch(() => undefined);
      if (isEditing && serviceToEdit) {
        await updateService(serviceToEdit._id, payload, token);
        toast.success("Service updated successfully.");
      } else {
        await createService(payload, token);
        toast.success("Service created successfully.");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save service. Please try again.",
      );
    } finally {
      setSubmitting(false);
      setUploadingImage(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl border-border-subtle bg-bg-surface-card p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-fg-primary">
            {isEditing ? "Update Service Information" : "Add New Salon Service"}
          </DialogTitle>
          <DialogDescription className="text-sm text-fg-muted">
            {isEditing
              ? "Modify the service details, pricing, duration, or active status."
              : "Create a new salon service with pricing, duration, and image upload."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2" noValidate>
          {/* Service Name */}
          <div className="space-y-1.5">
            <Label htmlFor="serviceName" className="text-fg-primary">
              Service Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="serviceName"
              placeholder="e.g. Classic Haircut & Blowdry"
              value={serviceName}
              onChange={(e) => {
                setServiceName(e.target.value);
                setFieldErrors((prev) => ({ ...prev, serviceName: "" }));
              }}
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.serviceName) || undefined}
            />
            {fieldErrors.serviceName ? (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="size-3.5 shrink-0" aria-hidden />
                {fieldErrors.serviceName}
              </p>
            ) : null}
          </div>

          {/* Service Category */}
          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-fg-primary">
              Service Category <span className="text-destructive">*</span>
            </Label>
            <select
              id="category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setFieldErrors((prev) => ({ ...prev, category: "" }));
              }}
              disabled={submitting}
              className="w-full rounded-md border border-border-subtle bg-bg-surface-card px-3 py-2 text-sm text-fg-primary outline-none focus:border-border-focus"
            >
              {SERVICE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {fieldErrors.category ? (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="size-3.5 shrink-0" aria-hidden />
                {fieldErrors.category}
              </p>
            ) : null}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-fg-primary">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Detailed description of the service and what clients can expect..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setFieldErrors((prev) => ({ ...prev, description: "" }));
              }}
              disabled={submitting}
              rows={3}
              aria-invalid={Boolean(fieldErrors.description) || undefined}
            />
            {fieldErrors.description ? (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="size-3.5 shrink-0" aria-hidden />
                {fieldErrors.description}
              </p>
            ) : null}
          </div>

          {/* Price and Duration (2-column on desktop) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="price" className="text-fg-primary">
                Price ($ USD) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="45.00"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, price: "" }));
                }}
                disabled={submitting}
                aria-invalid={Boolean(fieldErrors.price) || undefined}
              />
              <p className="text-[11px] text-fg-muted">
                Must be a positive number.
              </p>
              {fieldErrors.price ? (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="size-3.5 shrink-0" aria-hidden />
                  {fieldErrors.price}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="duration" className="text-fg-primary">
                Estimated Duration (Minutes){" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="duration"
                type="number"
                min="1"
                step="1"
                placeholder="45"
                value={duration}
                onChange={(e) => {
                  setDuration(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, duration: "" }));
                }}
                disabled={submitting}
                aria-invalid={Boolean(fieldErrors.duration) || undefined}
              />
              <p className="text-[11px] text-fg-muted">
                Must be a positive number.
              </p>
              {fieldErrors.duration ? (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="size-3.5 shrink-0" aria-hidden />
                  {fieldErrors.duration}
                </p>
              ) : null}
            </div>
          </div>

          {/* Service Image (Image Upload ONLY; No raw URL input) */}
          <div className="space-y-2">
            <Label htmlFor="serviceImage" className="text-fg-primary">
              Service Image (Upload Only){" "}
              <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-lg border border-dashed border-border-subtle bg-bg-canvas/50 p-4">
              <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border-subtle bg-bg-surface-card">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Service image preview"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <ImagePlus className="size-8 text-fg-muted" aria-hidden />
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <Input
                  id="serviceImage"
                  name="serviceImage"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  disabled={submitting || uploadingImage}
                  aria-invalid={Boolean(fieldErrors.image) || undefined}
                />
                <p className="flex items-center gap-1 text-xs text-fg-muted">
                  <UploadCloud className="size-3.5 shrink-0" aria-hidden />
                  Upload JPG, PNG or WebP image. Securely uploaded to ImgBB.
                </p>
                {fieldErrors.image ? (
                  <p className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="size-3.5 shrink-0" aria-hidden />
                    {fieldErrors.image}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Service Status */}
          <div className="space-y-1.5 pt-1">
            <Label className="text-fg-primary">Service Status</Label>
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-sm text-fg-primary cursor-pointer">
                <input
                  type="radio"
                  name="serviceStatus"
                  value="active"
                  checked={status === "active"}
                  onChange={() => setStatus("active")}
                  disabled={submitting}
                  className="accent-bg-accent-brand size-4"
                />
                <span>Active (Publicly visible & bookable)</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-fg-muted cursor-pointer">
                <input
                  type="radio"
                  name="serviceStatus"
                  value="inactive"
                  checked={status === "inactive"}
                  onChange={() => setStatus("inactive")}
                  disabled={submitting}
                  className="accent-bg-accent-brand size-4"
                />
                <span>Inactive (Hidden)</span>
              </label>
            </div>
            <p className="text-[11px] text-fg-muted">
              Default status is Active. Only active services are visible on
              Browse Services and available for booking.
            </p>
          </div>

          <DialogFooter className="gap-2 pt-4 border-t border-border-subtle">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting || uploadingImage}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || uploadingImage}
              className="bg-bg-accent-brand text-fg-on-accent hover:opacity-90 font-medium"
            >
              {submitting || uploadingImage ? (
                <Loader2 className="size-4 animate-spin mr-2" aria-hidden />
              ) : null}
              {submitting || uploadingImage
                ? uploadingImage
                  ? "Uploading Image…"
                  : "Saving Service…"
                : isEditing
                  ? "Update Service"
                  : "Add Service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
