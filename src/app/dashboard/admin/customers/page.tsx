import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CustomersManagementClient } from "@/components/admin/CustomersManagementClient";
import { getAllCustomersForAdmin } from "@/lib/api/users";
import { requireAdminSession } from "@/lib/core/server";

export const metadata: Metadata = {
  title: "Manage Customers | Velvet Saloon Admin",
  description:
    "View registered customers, inspect account details, and manage platform access via block/unblock.",
};

export default async function ManageCustomersPage() {
  const session = await requireAdminSession().catch(() => null);
  if (!session?.user) {
    redirect("/signin");
  }

  const customers = await getAllCustomersForAdmin({}, session.user.email);

  return <CustomersManagementClient initialCustomers={customers} />;
}
