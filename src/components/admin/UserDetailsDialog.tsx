"use client";

import {
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Mail,
  Phone,
  ShieldAlert,
  ShieldCheck,
  User,
} from "lucide-react";
import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toggleUserBlockStatusAction } from "@/lib/actions/users";
import { getTokenFromClient } from "@/lib/getTokenFromClient";
import type { UserProfile } from "@/types/user";

interface UserDetailsDialogProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusToggled?: (userId: string, isBlocked: boolean) => void;
}

export function UserDetailsDialog({
  user,
  isOpen,
  onClose,
  onStatusToggled,
}: UserDetailsDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [_confirmingBlock, setConfirmingBlock] = useState(false);

  if (!user) return null;

  const handleToggleBlock = (targetBlockState: boolean) => {
    startTransition(async () => {
      try {
        const token = await getTokenFromClient().catch(() => undefined);
        const res = await toggleUserBlockStatusAction(
          user._id,
          targetBlockState,
          token,
        );
        if (res.success) {
          toast.success(res.message);
          onStatusToggled?.(user._id, targetBlockState);
          setConfirmingBlock(false);
          onClose();
        }
      } catch (error) {
        const msg =
          error instanceof Error
            ? error.message
            : "Failed to update user block status.";
        toast.error(msg);
      }
    });
  };

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Not available";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-bg-surface-card border-border-subtle max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold text-fg-primary flex items-center gap-2">
              <User className="size-5 text-bg-accent-brand" />
              Customer Details
            </DialogTitle>
            <Badge
              className={`text-xs font-semibold px-2.5 py-0.5 ${
                user.isBlocked
                  ? "bg-red-600 text-white"
                  : "bg-emerald-600 text-white"
              }`}
            >
              {user.isBlocked ? "BLOCKED" : "ACTIVE"}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-fg-muted">
            Customer ID: #{user._id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          {/* User Profile Card */}
          <div className="flex items-center gap-3.5 rounded-xl border border-border-subtle bg-bg-canvas/50 p-4">
            <div className="relative size-14 rounded-xl border border-border-subtle bg-bg-surface-card overflow-hidden shrink-0 shadow-xs">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-bg-canvas text-fg-muted font-bold text-lg uppercase">
                  {(user.name || "C")[0]}
                </div>
              )}
            </div>
            <div className="space-y-0.5 min-w-0 flex-1">
              <h3 className="font-bold text-fg-primary text-base truncate">
                {user.name}
              </h3>
              <p className="text-xs text-fg-muted flex items-center gap-1.5 truncate">
                <Mail className="size-3 shrink-0" />
                <span className="truncate">{user.email}</span>
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-border-subtle bg-bg-canvas/50 p-3">
              <span className="text-fg-muted block mb-1">Phone Number</span>
              <span className="font-semibold text-fg-primary flex items-center gap-1.5">
                <Phone className="size-3 text-fg-muted" />
                {user.phone || "Not provided"}
              </span>
            </div>

            <div className="rounded-xl border border-border-subtle bg-bg-canvas/50 p-3">
              <span className="text-fg-muted block mb-1">Account Role</span>
              <span className="font-semibold text-fg-primary uppercase">
                {user.role}
              </span>
            </div>

            <div className="rounded-xl border border-border-subtle bg-bg-canvas/50 p-3">
              <span className="text-fg-muted block mb-1">Member Since</span>
              <span className="font-semibold text-fg-primary flex items-center gap-1.5">
                <Calendar className="size-3 text-fg-muted" />
                {formattedDate}
              </span>
            </div>

            <div className="rounded-xl border border-border-subtle bg-bg-canvas/50 p-3">
              <span className="text-fg-muted block mb-1">Total Bookings</span>
              <span className="font-semibold text-fg-primary flex items-center gap-1.5">
                <CalendarCheck className="size-3 text-bg-accent-brand" />
                {user.totalAppointments ?? 0} appointments
              </span>
            </div>
          </div>

          {/* Account Status Context Alert */}
          {user.isBlocked ? (
            <div className="rounded-xl border border-red-600/30 bg-red-50/70 p-3 text-xs text-red-800 flex items-start gap-2">
              <ShieldAlert className="size-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Account Suspended</span>
                <span>
                  This user is blocked. They cannot book services, update their
                  profile, or access protected platform features.
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-600/30 bg-emerald-50/70 p-3 text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Active Account</span>
                <span>
                  This customer is in good standing and has full access to salon
                  services and appointments.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <DialogFooter className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-border-subtle">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={onClose}
            className="w-full sm:w-auto border-border-subtle text-fg-primary text-xs"
          >
            Close
          </Button>

          {user.isBlocked ? (
            <Button
              type="button"
              disabled={isPending}
              onClick={() => handleToggleBlock(false)}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
            >
              <ShieldCheck className="size-3.5 mr-1.5" />
              Unblock Customer
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={() => handleToggleBlock(true)}
              className="w-full sm:w-auto font-semibold text-xs"
            >
              <ShieldAlert className="size-3.5 mr-1.5" />
              Block Customer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
