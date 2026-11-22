"use client";

import {
  CalendarCheck,
  CheckCircle2,
  Eye,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { UserDetailsDialog } from "@/components/admin/UserDetailsDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toggleUserBlockStatusAction } from "@/lib/actions/users";
import { getTokenFromClient } from "@/lib/getTokenFromClient";
import type { UserProfile } from "@/types/user";

interface CustomersManagementClientProps {
  initialCustomers: UserProfile[];
}

export function CustomersManagementClient({
  initialCustomers,
}: CustomersManagementClientProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState<UserProfile[]>(initialCustomers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "blocked"
  >("all");

  // Dialog state
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Quick Action Confirmation Dialog State
  const [targetToggleUser, setTargetToggleUser] = useState<UserProfile | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  // Compute live statistics
  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((c) => !c.isBlocked).length;
    const blocked = customers.filter((c) => c.isBlocked).length;
    return { total, active, blocked };
  }, [customers]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Status filter
      if (statusFilter === "active" && c.isBlocked) return false;
      if (statusFilter === "blocked" && !c.isBlocked) return false;

      // Search filter
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const matchesName = c.name?.toLowerCase().includes(query);
        const matchesEmail = c.email?.toLowerCase().includes(query);
        const matchesPhone = c.phone?.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesPhone) return false;
      }

      return true;
    });
  }, [customers, search, statusFilter]);

  // Action: Toggle Block Status
  const handleConfirmToggleBlock = () => {
    if (!targetToggleUser) return;

    const newBlockedState = !targetToggleUser.isBlocked;

    startTransition(async () => {
      try {
        const token = await getTokenFromClient().catch(() => undefined);
        const res = await toggleUserBlockStatusAction(
          targetToggleUser._id,
          newBlockedState,
          token,
        );
        if (res.success) {
          toast.success(res.message);
          setCustomers((prev) =>
            prev.map((c) =>
              c._id === targetToggleUser._id
                ? { ...c, isBlocked: newBlockedState }
                : c,
            ),
          );
          if (selectedUser?._id === targetToggleUser._id) {
            setSelectedUser((prev) =>
              prev ? { ...prev, isBlocked: newBlockedState } : null,
            );
          }
          setTargetToggleUser(null);
          router.refresh();
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

  const openDetails = (user: UserProfile) => {
    setSelectedUser(user);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg-primary sm:text-3xl flex items-center gap-2">
            <Users className="size-7 text-bg-accent-brand" />
            Manage Customers
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            View registered salon customers, review account activity, and
            control platform access.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.refresh()}
          className="self-start sm:self-auto border-border-subtle text-fg-primary text-xs"
        >
          <RefreshCw className="size-3.5 mr-1.5" />
          Refresh List
        </Button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Customers */}
        <Card className="border-border-subtle bg-bg-surface-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-fg-muted">
                Total Registered Customers
              </span>
              <div className="mt-1 text-2xl font-bold text-fg-primary">
                {stats.total}
              </div>
              <span className="text-[11px] text-fg-muted">
                All salon client accounts
              </span>
            </div>
            <div className="flex size-11 items-center justify-center rounded-xl bg-bg-canvas text-bg-accent-brand">
              <Users className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Active Customers */}
        <Card className="border-border-subtle bg-bg-surface-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-600">
                Active Customers
              </span>
              <div className="mt-1 text-2xl font-bold text-emerald-600">
                {stats.active}
              </div>
              <span className="text-[11px] text-fg-muted">
                Full platform access
              </span>
            </div>
            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Blocked Customers */}
        <Card className="border-border-subtle bg-bg-surface-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-red-600">
                Blocked / Suspended
              </span>
              <div className="mt-1 text-2xl font-bold text-red-600">
                {stats.blocked}
              </div>
              <span className="text-[11px] text-fg-muted">
                Restricted from booking
              </span>
            </div>
            <div className="flex size-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <ShieldAlert className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-bg-surface-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-md">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
            aria-hidden
          />
          <Input
            placeholder="Search by customer name, email, or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-border-subtle bg-bg-canvas/50 p-1 text-xs">
          {(["all", "active", "blocked"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                statusFilter === st
                  ? "bg-bg-accent-brand text-fg-on-accent shadow-xs"
                  : "text-fg-muted hover:text-fg-primary"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Customer List / Table */}
      {filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-subtle bg-bg-surface-card p-12 text-center shadow-xs">
          <div className="flex size-14 items-center justify-center rounded-full bg-bg-canvas text-fg-muted mb-4">
            <Users className="size-6" aria-hidden />
          </div>
          <h3 className="text-base font-bold text-fg-primary">
            No customers found
          </h3>
          <p className="mt-1 max-w-sm text-xs text-fg-muted">
            {customers.length === 0
              ? "No registered customer accounts exist yet in the database."
              : "No customer records match your active search or filter criteria."}
          </p>
          {search || statusFilter !== "all" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
              className="mt-4 border-border-subtle text-xs"
            >
              Reset Filters
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border-subtle bg-bg-canvas/50 text-fg-muted uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Contact</th>
                  <th className="py-3 px-4 font-semibold">Total Bookings</th>
                  <th className="py-3 px-4 font-semibold">Joined On</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-fg-primary">
                {filteredCustomers.map((c) => {
                  const formattedDate = c.createdAt
                    ? new Date(c.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—";

                  return (
                    <tr
                      key={c._id}
                      className="hover:bg-bg-canvas/40 transition-colors"
                    >
                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative size-10 rounded-xl overflow-hidden bg-bg-canvas border border-border-subtle shrink-0">
                            {c.image ? (
                              <Image
                                src={c.image}
                                alt={c.name}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center font-bold text-xs uppercase text-fg-muted">
                                {(c.name || "C")[0]}
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-fg-primary block line-clamp-1">
                              {c.name}
                            </span>
                            <span className="text-[11px] text-fg-muted flex items-center gap-1 mt-0.5">
                              <Mail className="size-3 text-fg-muted" />
                              <span className="line-clamp-1">{c.email}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 text-fg-muted">
                        {c.phone ? (
                          <span className="flex items-center gap-1 font-medium text-fg-primary">
                            <Phone className="size-3 text-fg-muted" />
                            {c.phone}
                          </span>
                        ) : (
                          <span className="text-fg-muted italic">Not set</span>
                        )}
                      </td>

                      {/* Bookings */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-semibold text-fg-primary">
                          <CalendarCheck className="size-3.5 text-bg-accent-brand" />
                          <span>{c.totalAppointments ?? 0}</span>
                        </span>
                      </td>

                      {/* Joined On */}
                      <td className="py-3.5 px-4 text-[11px] text-fg-muted whitespace-nowrap">
                        {formattedDate}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <Badge
                          className={`text-[10px] font-semibold px-2 py-0.5 ${
                            c.isBlocked
                              ? "bg-red-600 text-white"
                              : "bg-emerald-600 text-white"
                          }`}
                        >
                          {c.isBlocked ? "BLOCKED" : "ACTIVE"}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Details */}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="View Customer Details"
                            onClick={() => openDetails(c)}
                            className="size-8 text-fg-muted hover:text-fg-primary"
                          >
                            <Eye className="size-4" />
                          </Button>

                          {/* Block / Unblock Toggle Button */}
                          {c.isBlocked ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setTargetToggleUser(c)}
                              className="h-7 px-2.5 text-[11px] font-semibold border-emerald-600/30 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                            >
                              <ShieldCheck className="size-3 mr-1" />
                              Unblock
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setTargetToggleUser(c)}
                              className="h-7 px-2.5 text-[11px] font-semibold border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <ShieldAlert className="size-3 mr-1" />
                              Block
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      <UserDetailsDialog
        user={selectedUser}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onStatusToggled={(userId, isBlocked) => {
          setCustomers((prev) =>
            prev.map((c) => (c._id === userId ? { ...c, isBlocked } : c)),
          );
        }}
      />

      {/* Block / Unblock Confirmation Modal */}
      <Dialog
        open={Boolean(targetToggleUser)}
        onOpenChange={(open) => !open && setTargetToggleUser(null)}
      >
        <DialogContent className="max-w-md bg-bg-surface-card border-border-subtle">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-fg-primary flex items-center gap-2">
              {targetToggleUser?.isBlocked ? (
                <>
                  <ShieldCheck className="size-5 text-emerald-600" />
                  Unblock Customer Account?
                </>
              ) : (
                <>
                  <ShieldAlert className="size-5 text-red-600" />
                  Block Customer Account?
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-fg-muted mt-1">
              Customer:{" "}
              <strong className="text-fg-primary">
                {targetToggleUser?.name}
              </strong>{" "}
              ({targetToggleUser?.email})
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-border-subtle bg-bg-canvas/50 p-3.5 text-xs text-fg-muted">
            {targetToggleUser?.isBlocked ? (
              <p>
                Unblocking this customer will restore their ability to sign in,
                book salon appointments, and manage their account profile.
              </p>
            ) : (
              <p className="text-red-700">
                Blocking this customer will immediately prevent them from
                submitting appointment requests, modifying their account, or
                accessing protected platform features.
              </p>
            )}
          </div>

          <DialogFooter className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setTargetToggleUser(null)}
              className="border-border-subtle text-xs text-fg-primary"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={targetToggleUser?.isBlocked ? "default" : "destructive"}
              disabled={isPending}
              onClick={handleConfirmToggleBlock}
              className={`text-xs font-semibold ${
                targetToggleUser?.isBlocked
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : ""
              }`}
            >
              {targetToggleUser?.isBlocked
                ? "Confirm Unblock"
                : "Confirm Block"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
