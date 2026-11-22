import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth-helpers";
import { getServerSession } from "@/lib/core/server";

export default async function DashboardProfileRedirect() {
  const session = await getServerSession();
  if (!session?.user) {
    redirect("/signin");
  }

  const role = getUserRole(session.user);
  if (role === "admin") {
    redirect("/dashboard/admin/profile");
  } else {
    redirect("/dashboard/customer/profile");
  }
}
