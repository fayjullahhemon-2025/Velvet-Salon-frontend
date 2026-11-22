import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import type { Transaction } from "@/types/transaction";

/**
 * Normalizes a raw transaction document.
 */
function normalizeTransaction(raw: Record<string, unknown>): Transaction {
  return {
    _id: String(raw._id),
    appointmentId: String(raw.appointmentId ?? ""),
    customerId: String(raw.customerId ?? ""),
    amount: Number(raw.amount ?? 0),
    currency: String(raw.currency ?? "usd"),
    stripeSessionId: String(raw.stripeSessionId ?? ""),
    status: raw.status === "failed" ? "failed" : "paid",
    createdAt:
      raw.createdAt instanceof Date
        ? raw.createdAt.toISOString()
        : String(raw.createdAt ?? new Date().toISOString()),
    customerName: raw.customerName ? String(raw.customerName) : undefined,
    customerEmail: raw.customerEmail ? String(raw.customerEmail) : undefined,
    customerImage: raw.customerImage ? String(raw.customerImage) : undefined,
    serviceName: raw.serviceName ? String(raw.serviceName) : undefined,
    serviceCategory: raw.serviceCategory
      ? String(raw.serviceCategory)
      : undefined,
    serviceImage: raw.serviceImage ? String(raw.serviceImage) : undefined,
    appointmentDate: raw.appointmentDate
      ? String(raw.appointmentDate)
      : undefined,
    timeSlot: raw.timeSlot ? String(raw.timeSlot) : undefined,
  };
}

/**
 * Retrieves all transactions for the Admin dashboard, enriched with
 * customer information and appointment/service details.
 */
export async function getAllTransactionsForAdmin(): Promise<Transaction[]> {
  try {
    const db = await getDb();
    const rawTransactions = await db
      .collection("transactions")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    if (!rawTransactions || rawTransactions.length === 0) {
      return [];
    }

    // Collect IDs for enrichment
    const appointmentIds = rawTransactions
      .map((t) => String(t.appointmentId ?? ""))
      .filter(Boolean)
      .map((id) => (ObjectId.isValid(id) ? new ObjectId(id) : id));

    const customerIds = rawTransactions
      .map((t) => String(t.customerId ?? ""))
      .filter(Boolean)
      .map((id) => (ObjectId.isValid(id) ? new ObjectId(id) : id));

    const customerEmails = rawTransactions
      .map((t) => String(t.customerId ?? ""))
      .filter((id) => id.includes("@"));

    // Fetch related appointments
    const appointments = await db
      .collection("appointments")
      .find({
        _id: { $in: appointmentIds as unknown as ObjectId[] },
      })
      .toArray();

    const appMap = new Map<string, Record<string, unknown>>();
    for (const app of appointments) {
      appMap.set(String(app._id), app);
    }

    // Fetch related users
    const hasUsersColl = (await db.collection("users").countDocuments()) > 0;
    const targetColl = hasUsersColl
      ? db.collection("users")
      : db.collection("user");

    const users = await targetColl
      .find({
        $or: [
          { _id: { $in: customerIds as unknown as ObjectId[] } },
          { email: { $in: customerEmails } },
        ],
      })
      .toArray();

    const userMap = new Map<string, Record<string, unknown>>();
    for (const u of users) {
      userMap.set(String(u._id), u);
      if (u.email) userMap.set(String(u.email).toLowerCase(), u);
    }

    return rawTransactions.map((tx) => {
      const app = appMap.get(String(tx.appointmentId));
      const user =
        userMap.get(String(tx.customerId)) ||
        (app?.customerEmail
          ? userMap.get(String(app.customerEmail).toLowerCase())
          : undefined);

      return normalizeTransaction({
        ...tx,
        customerName:
          user?.name || app?.customerName || tx.customerName || "Customer",
        customerEmail:
          user?.email || app?.customerEmail || tx.customerEmail || "",
        customerImage: user?.image || undefined,
        serviceName: app?.serviceName || tx.serviceName || "Salon Service",
        serviceCategory: app?.serviceCategory || tx.serviceCategory || "",
        serviceImage: app?.serviceImage || undefined,
        appointmentDate: app?.appointmentDate || tx.appointmentDate || "",
        timeSlot: app?.timeSlot || tx.timeSlot || "",
      });
    });
  } catch (error) {
    console.error("Error fetching transactions for admin:", error);
    return [];
  }
}

/**
 * Retrieves a single transaction by its ID or Stripe session ID.
 */
export async function getTransactionById(
  idOrSessionId: string,
): Promise<Transaction | null> {
  if (!idOrSessionId) return null;

  try {
    const db = await getDb();
    const query = ObjectId.isValid(idOrSessionId)
      ? {
          $or: [
            { _id: new ObjectId(idOrSessionId) },
            { stripeSessionId: idOrSessionId },
          ],
        }
      : { stripeSessionId: idOrSessionId };

    const doc = await db.collection("transactions").findOne(query);
    if (!doc) return null;

    return normalizeTransaction(doc);
  } catch (error) {
    console.error(`Error fetching transaction ${idOrSessionId}:`, error);
    return null;
  }
}
