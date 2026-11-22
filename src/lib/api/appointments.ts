import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import type { Appointment, AppointmentFilterParams } from "@/types/appointment";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5000";

// Normalize MongoDB document to typed Appointment
function normalizeAppointment(doc: Record<string, unknown>): Appointment {
  return {
    _id: doc._id ? String(doc._id) : "",
    serviceId: String(doc.serviceId || ""),
    customerId: String(doc.customerId || ""),
    customerName: doc.customerName ? String(doc.customerName) : undefined,
    customerEmail: doc.customerEmail ? String(doc.customerEmail) : undefined,
    serviceName: doc.serviceName ? String(doc.serviceName) : undefined,
    serviceImage: doc.serviceImage ? String(doc.serviceImage) : undefined,
    serviceCategory: doc.serviceCategory
      ? String(doc.serviceCategory)
      : undefined,
    servicePrice: Number(doc.servicePrice) || 0,
    appointmentDate: String(doc.appointmentDate || ""),
    timeSlot: String(doc.timeSlot || ""),
    message: doc.message ? String(doc.message) : undefined,
    paymentStatus: (doc.paymentStatus === "paid" ? "paid" : "unpaid") as
      | "paid"
      | "unpaid",
    status: (doc.status === "confirmed"
      ? "confirmed"
      : doc.status === "cancelled"
        ? "cancelled"
        : "pending") as "pending" | "confirmed" | "cancelled",
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : String(doc.createdAt || new Date().toISOString()),
    updatedAt:
      doc.updatedAt instanceof Date
        ? doc.updatedAt.toISOString()
        : doc.updatedAt
          ? String(doc.updatedAt)
          : undefined,
  };
}

/**
 * Fetch booked time slots for a given service and date.
 * Used to disable already reserved slots in real time.
 */
export async function getBookedSlots(
  serviceId: string,
  date: string,
): Promise<string[]> {
  if (!serviceId || !date) return [];

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/appointments/booked-slots?serviceId=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(date)}`,
      { next: { revalidate: 0 } },
    );
    if (res.ok) {
      const payload = await res.json();
      if (payload?.success && Array.isArray(payload.bookedSlots)) {
        return payload.bookedSlots;
      }
    }
  } catch {
    // Fallback directly to shared database
  }

  try {
    const db = await getDb();
    const docs = await db
      .collection("appointments")
      .find({
        serviceId: String(serviceId),
        appointmentDate: String(date),
        status: { $in: ["pending", "confirmed"] },
      })
      .project({ timeSlot: 1 })
      .toArray();

    return docs.map((d) => String(d.timeSlot));
  } catch (error) {
    console.error("Failed to query booked slots from DB:", error);
    return [];
  }
}

/**
 * Fetch all appointments matching optional filter params (admin or customer scope).
 */
export async function getAppointments(
  params?: AppointmentFilterParams,
  headersInit?: Record<string, string>,
): Promise<Appointment[]> {
  const query = new URLSearchParams();
  if (params?.customerId) query.set("customerId", params.customerId);
  if (params?.serviceId) query.set("serviceId", params.serviceId);
  if (params?.status) query.set("status", params.status);
  if (params?.date) query.set("date", params.date);

  try {
    const qs = query.toString();
    const res = await fetch(
      `${BACKEND_URL}/api/appointments${qs ? `?${qs}` : ""}`,
      {
        headers: headersInit,
        next: { revalidate: 0 },
      },
    );
    if (res.ok) {
      const payload = await res.json();
      if (payload?.success && Array.isArray(payload.data)) {
        return payload.data.map(normalizeAppointment);
      }
    }
  } catch {
    // Fallback to shared database
  }

  try {
    const db = await getDb();
    const mongoQuery: Record<string, unknown> = {};

    if (params?.customerId) {
      mongoQuery.customerId = String(params.customerId);
    }
    if (params?.serviceId) {
      mongoQuery.serviceId = String(params.serviceId);
    }
    if (params?.status && params.status !== "all") {
      mongoQuery.status = params.status;
    }
    if (params?.date) {
      mongoQuery.appointmentDate = params.date;
    }

    const docs = await db
      .collection("appointments")
      .find(mongoQuery)
      .sort({ createdAt: -1 })
      .toArray();

    return docs.map(normalizeAppointment);
  } catch (error) {
    console.error("Failed to query appointments from DB:", error);
    return [];
  }
}

/**
 * Fetch a customer's specific appointments.
 * Matches on customerId or customerEmail to ensure complete retrieval.
 */
export async function getCustomerAppointments(
  customerId: string,
  customerEmail?: string,
): Promise<Appointment[]> {
  if (!customerId && !customerEmail) return [];

  try {
    const db = await getDb();
    const orConditions: Record<string, unknown>[] = [];
    if (customerId) orConditions.push({ customerId: String(customerId) });
    if (customerEmail)
      orConditions.push({ customerEmail: String(customerEmail) });

    const query =
      orConditions.length > 1 ? { $or: orConditions } : orConditions[0] || {};

    const docs = await db
      .collection("appointments")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return docs.map(normalizeAppointment);
  } catch (error) {
    console.error("Failed to query customer appointments from DB:", error);
    return getAppointments({ customerId });
  }
}

/**
 * Fetch all appointments for Admin management.
 * Admin can manage all appointments.
 */
export async function getAllAppointmentsForAdmin(
  params?: AppointmentFilterParams,
): Promise<Appointment[]> {
  return getAppointments(params, { "x-user-role": "admin" });
}

/**
 * Fetch a single appointment by ID.
 */
export async function getAppointmentById(
  id: string,
): Promise<Appointment | null> {
  if (!id) return null;

  try {
    const res = await fetch(`${BACKEND_URL}/api/appointments/${id}`, {
      next: { revalidate: 0 },
    });
    if (res.ok) {
      const payload = await res.json();
      if (payload?.success && payload.data) {
        return normalizeAppointment(payload.data);
      }
    }
  } catch {
    // Fallback to database
  }

  try {
    const db = await getDb();
    if (!ObjectId.isValid(id)) return null;

    const doc = await db
      .collection("appointments")
      .findOne({ _id: new ObjectId(id) });
    if (!doc) return null;

    return normalizeAppointment(doc);
  } catch (error) {
    console.error(`Failed to fetch appointment ${id} from DB:`, error);
    return null;
  }
}
