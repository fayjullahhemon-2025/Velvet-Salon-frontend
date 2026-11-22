import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TransactionsManagementClient } from "@/components/admin/TransactionsManagementClient";
import { getAllTransactionsForAdmin } from "@/lib/api/transactions";
import { requireAdminSession } from "@/lib/core/server";

export const instant = false;

export const metadata: Metadata = {
  title: "Transactions | Velvet Saloon Admin",
  description:
    "Review verified customer Stripe transactions and booking payment records.",
};

export default async function AdminTransactionsPage() {
  const session = await requireAdminSession().catch(() => null);
  if (!session?.user) {
    redirect("/signin");
  }

  const transactions = await getAllTransactionsForAdmin();

  return <TransactionsManagementClient initialTransactions={transactions} />;
}
