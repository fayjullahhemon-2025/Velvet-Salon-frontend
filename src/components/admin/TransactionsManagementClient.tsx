"use client";

import {
  CheckCircle2,
  Copy,
  DollarSign,
  Eye,
  Receipt,
  Search,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Transaction } from "@/types/transaction";

interface TransactionsManagementClientProps {
  initialTransactions: Transaction[];
}

export function TransactionsManagementClient({
  initialTransactions,
}: TransactionsManagementClientProps) {
  const [transactions] = useState<Transaction[]>(initialTransactions);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "failed">(
    "all",
  );
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Statistics
  const stats = useMemo(() => {
    const paidTxs = transactions.filter((t) => t.status === "paid");
    const totalRevenue = paidTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
    const avgValue = paidTxs.length > 0 ? totalRevenue / paidTxs.length : 0;
    const failedCount = transactions.filter(
      (t) => t.status === "failed",
    ).length;

    return {
      totalRevenue,
      successfulCount: paidTxs.length,
      avgValue,
      failedCount,
    };
  }, [transactions]);

  // Filtering
  const displayedTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (statusFilter !== "all" && tx.status !== statusFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesName = (tx.customerName || "").toLowerCase().includes(q);
        const matchesEmail = (tx.customerEmail || "").toLowerCase().includes(q);
        const matchesService = (tx.serviceName || "").toLowerCase().includes(q);
        const matchesSession = (tx.stripeSessionId || "")
          .toLowerCase()
          .includes(q);
        const matchesId = (tx._id || "").toLowerCase().includes(q);

        if (
          !matchesName &&
          !matchesEmail &&
          !matchesService &&
          !matchesSession &&
          !matchesId
        ) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, statusFilter, search]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg-primary sm:text-3xl">
          Payment Transactions
        </h1>
        <p className="mt-1 text-xs text-fg-muted">
          Review verified Stripe payments and customer transaction records.
          Transaction entries are authoritative and read-only.
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border-subtle bg-bg-surface-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-fg-muted">
              Total Revenue
            </CardTitle>
            <DollarSign className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-fg-primary">
              ${stats.totalRevenue.toFixed(2)}
            </div>
            <p className="text-[11px] text-fg-muted mt-1">
              Verified through Stripe
            </p>
          </CardContent>
        </Card>

        <Card className="border-border-subtle bg-bg-surface-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-fg-muted">
              Successful Payments
            </CardTitle>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-fg-primary">
              {stats.successfulCount}
            </div>
            <p className="text-[11px] text-fg-muted mt-1">Paid appointments</p>
          </CardContent>
        </Card>

        <Card className="border-border-subtle bg-bg-surface-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-fg-muted">
              Average Booking Value
            </CardTitle>
            <TrendingUp className="size-4 text-bg-accent-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-fg-primary">
              ${stats.avgValue.toFixed(2)}
            </div>
            <p className="text-[11px] text-fg-muted mt-1">Per paid checkout</p>
          </CardContent>
        </Card>

        <Card className="border-border-subtle bg-bg-surface-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-fg-muted">
              Failed Transactions
            </CardTitle>
            <XCircle className="size-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-fg-primary">
              {stats.failedCount}
            </div>
            <p className="text-[11px] text-fg-muted mt-1">Payment exceptions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-border-subtle bg-bg-surface-card shadow-xs p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-xs">
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
              aria-hidden
            />
            <Input
              placeholder="Search by customer, service, session ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
              className={`text-xs h-8 ${
                statusFilter === "all"
                  ? "bg-bg-accent-brand text-fg-on-accent"
                  : "border-border-subtle text-fg-muted"
              }`}
            >
              All
            </Button>
            <Button
              variant={statusFilter === "paid" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("paid")}
              className={`text-xs h-8 ${
                statusFilter === "paid"
                  ? "bg-bg-accent-brand text-fg-on-accent"
                  : "border-border-subtle text-fg-muted"
              }`}
            >
              Paid
            </Button>
            <Button
              variant={statusFilter === "failed" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("failed")}
              className={`text-xs h-8 ${
                statusFilter === "failed"
                  ? "bg-bg-accent-brand text-fg-on-accent"
                  : "border-border-subtle text-fg-muted"
              }`}
            >
              Failed
            </Button>
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card className="border-border-subtle bg-bg-surface-card shadow-xs overflow-hidden">
        {displayedTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Receipt className="size-10 text-fg-muted/40 mb-3" />
            <h3 className="text-base font-bold text-fg-primary">
              No Transactions Found
            </h3>
            <p className="mt-1 text-xs text-fg-muted max-w-sm">
              {search || statusFilter !== "all"
                ? "No payment records match your search or filter criteria."
                : "Transactions will appear here once customers pay for confirmed appointments via Stripe."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg-canvas/50 text-fg-muted border-b border-border-subtle">
                <tr>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Related Service</th>
                  <th className="py-3 px-4 font-semibold">Appointment</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold">Stripe Ref</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {displayedTransactions.map((tx) => {
                  const formattedDate = new Date(
                    tx.createdAt,
                  ).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr
                      key={tx._id}
                      className="hover:bg-bg-canvas/30 transition-colors"
                    >
                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-fg-primary">
                          {tx.customerName || "Customer"}
                        </div>
                        <div className="text-[11px] text-fg-muted truncate max-w-[160px]">
                          {tx.customerEmail || tx.customerId}
                        </div>
                      </td>

                      {/* Service */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-fg-primary">
                          {tx.serviceName || "Salon Service"}
                        </div>
                        {tx.serviceCategory ? (
                          <div className="text-[11px] text-fg-muted">
                            {tx.serviceCategory}
                          </div>
                        ) : null}
                      </td>

                      {/* Appointment */}
                      <td className="py-3 px-4">
                        <div className="text-fg-primary font-medium">
                          {tx.appointmentDate || "—"}
                        </div>
                        {tx.timeSlot ? (
                          <div className="text-[11px] text-fg-muted">
                            {tx.timeSlot}
                          </div>
                        ) : null}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-fg-primary">
                          ${tx.amount.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-fg-muted uppercase ml-1">
                          {tx.currency}
                        </span>
                      </td>

                      {/* Stripe Reference */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 font-mono text-[11px] text-fg-muted">
                          <span className="truncate max-w-[120px]">
                            {tx.stripeSessionId}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(
                                tx.stripeSessionId,
                                "Stripe Session ID",
                              )
                            }
                            className="hover:text-fg-primary p-0.5"
                            title="Copy Session ID"
                          >
                            <Copy className="size-3" />
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold px-2 py-0.5 ${
                            tx.status === "paid"
                              ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                              : "border-red-500/40 text-red-400 bg-red-500/10"
                          }`}
                        >
                          {tx.status.toUpperCase()}
                        </Badge>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-fg-muted">
                        {formattedDate}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTx(tx)}
                          className="h-7 px-2 text-fg-muted hover:text-fg-primary"
                        >
                          <Eye className="size-3.5 mr-1" />
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Read-Only Transaction Inspection Dialog */}
      <Dialog
        open={Boolean(selectedTx)}
        onOpenChange={(open) => !open && setSelectedTx(null)}
      >
        <DialogContent className="max-w-md bg-bg-surface-card border-border-subtle">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Receipt className="size-5 text-bg-accent-brand" />
              <DialogTitle className="text-base font-bold text-fg-primary">
                Transaction Details
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-fg-muted">
              Reference #{selectedTx?._id} • Read-Only
            </DialogDescription>
          </DialogHeader>

          {selectedTx ? (
            <div className="space-y-4 py-2 text-xs">
              <div className="rounded-xl border border-border-subtle bg-bg-canvas/50 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-fg-muted">Amount</span>
                  <span className="font-bold text-fg-primary text-base">
                    ${selectedTx.amount.toFixed(2)}{" "}
                    {selectedTx.currency.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-fg-muted">Verification Status</span>
                  <Badge
                    variant="outline"
                    className="border-emerald-600 text-emerald-600 bg-emerald-50 font-semibold text-[10px]"
                  >
                    {selectedTx.status.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-border-subtle text-fg-muted">
                  <span>Customer Name</span>
                  <span className="font-semibold text-fg-primary">
                    {selectedTx.customerName || "Customer"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle text-fg-muted">
                  <span>Customer Email</span>
                  <span className="font-medium text-fg-primary">
                    {selectedTx.customerEmail || selectedTx.customerId}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle text-fg-muted">
                  <span>Service</span>
                  <span className="font-medium text-fg-primary">
                    {selectedTx.serviceName || "Salon Service"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle text-fg-muted">
                  <span>Appointment Slot</span>
                  <span className="font-medium text-fg-primary">
                    {selectedTx.appointmentDate} at {selectedTx.timeSlot}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle text-fg-muted">
                  <span>Stripe Session ID</span>
                  <span className="font-mono text-[11px] text-fg-primary truncate max-w-[200px]">
                    {selectedTx.stripeSessionId}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle text-fg-muted">
                  <span>Recorded At</span>
                  <span className="text-fg-primary">
                    {new Date(selectedTx.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-bg-canvas p-3 text-[11px] text-fg-muted border border-border-subtle">
                <span className="font-semibold text-fg-primary">Note: </span>
                Transaction records are immutable and populated exclusively via
                verified Stripe Webhook / Session verification. Manual status
                overrides are disabled by design.
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="w-full border-border-subtle text-xs"
              onClick={() => setSelectedTx(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
