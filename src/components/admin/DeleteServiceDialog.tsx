"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
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
import { deleteService } from "@/lib/actions/services";
import { getTokenFromClient } from "@/lib/getTokenFromClient";
import type { Service } from "@/types/service";

interface DeleteServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  onSuccess?: () => void;
}

export function DeleteServiceDialog({
  open,
  onOpenChange,
  service,
  onSuccess,
}: DeleteServiceDialogProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!service || deleting) return;

    setDeleting(true);
    try {
      const token = await getTokenFromClient().catch(() => undefined);
      await deleteService(service._id, token);
      toast.success(`Service "${service.serviceName}" was deleted.`);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete service. Please try again.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border-subtle bg-bg-surface-card p-6">
        <DialogHeader>
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
            <Trash2 className="size-6" aria-hidden />
          </div>
          <DialogTitle className="text-center text-lg font-bold text-fg-primary">
            Delete Salon Service
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-fg-muted">
            Are you sure you want to permanently delete{" "}
            <span className="font-semibold text-fg-primary">
              "{service?.serviceName}"
            </span>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:justify-center pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="size-4 animate-spin mr-2" aria-hidden />
            ) : null}
            {deleting ? "Deleting…" : "Delete Service"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
