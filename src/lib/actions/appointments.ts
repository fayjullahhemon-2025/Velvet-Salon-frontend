"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import {
  getAllAppointmentsForAdmin,
  getBookedSlots,
  getCustomerAppointments,
} from "@/lib/api/appointments";
import { requireAdminSession, requireCustomerSession } from "@/lib/core/server";
import { getDb } from "@/lib/db";
import { getTokenFromServer } from "@/lib/getTokenFromServer";
import type {
  Appointment,
  AppointmentFilterParams,
  CreateAppointmentInput,
} from "@/types/appointment";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5000";

/**
 * Server action to create a new appointment booking.
 * Rules enforced:
 * 1. Only authenticated Customers can submit appointment requests (Admins cannot book).
 * 2. Prevent customers from booking inactive services.
 * 3. Prevent duplicate active appointments for the same date and time slot.
 * 4. Default Appointment Status: Pending.
 * 5. Default Payment Status: Unpaid.
 */
export async function createAppointmentAction(input: CreateAppointmentInput) {
  const session = await requireCustomerSession();
  const customerId = session.user.id;
  const customerEmail = session.user.email;
  const customerName = session.user.name || "Customer";

  const { serviceId, appointmentDate, timeSlot, message } = input;

  // 1. Validate service
  if (!serviceId || !ObjectId.isValid(serviceId)) {
    throw new Error("Invalid service selected.");
  }

  const db = await getDb();
  const service = await db
    .collection("services")
    .findOne({ _id: new ObjectId(serviceId) });

  if (!service) {
    throw new Error("The selected salon service could not be found.");
  }

  if (service.status !== "active") {
    throw new Error(
      "This salon service is currently inactive and cannot be booked.",
    );
  }

  // 2. Validate appointment date
  if (!appointmentDate || typeof appointmentDate !== "string") {
    throw new Error("Please select a valid appointment date.");
  }

  const todayStr = new Date().toISOString().split("T")[0];
  if (appointmentDate < todayStr) {
    throw new Error("Appointment date cannot be in the past.");
  }

  // 3. Validate time slot
  if (!timeSlot || !timeSlot.trim()) {
    throw new Error("Please choose an available appointment time slot.");
  }
  const cleanSlot = timeSlot.trim();

  // 4. Rule: Prevent duplicate active appointments for the same date and time slot
  // A) Check service duplicate
  const existingServiceSlot = await db.collection("appointments").findOne({
    serviceId: String(service._id),
    appointmentDate,
    timeSlot: cleanSlot,
    status: { $in: ["pending", "confirmed"] },
  });

  if (existingServiceSlot) {
    throw new Error(
      "This time slot is already booked for this service. Please choose another time slot.",
    );
  }

  // B) Check customer duplicate
  const existingCustomerSlot = await db.collection("appointments").findOne({
    customerId: String(customerId),
    appointmentDate,
    timeSlot: cleanSlot,
    status: { $in: ["pending", "confirmed"] },
  });

  if (existingCustomerSlot) {
    throw new Error(
      "You already have an active appointment scheduled for this date and time slot.",
    );
  }

  const newAppointment = {
    serviceId: String(service._id),
    customerId: String(customerId),
    customerName,
    customerEmail,
    serviceName: service.serviceName,
    serviceImage: service.image,
    serviceCategory: service.category,
    servicePrice: Number(service.price) || 0,
    appointmentDate,
    timeSlot: cleanSlot,
    message: message ? message.trim() : "",
    paymentStatus: "unpaid" as const, // Default Payment Status: Unpaid
    status: "pending" as const, // Default Appointment Status: Pending
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Attempt backend API call first
  try {
    const token =
      input?.token || (await getTokenFromServer().catch(() => null));
    const reqHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "x-user-role": "customer",
      "x-user-email": customerEmail,
      "x-user-id": customerId,
      "x-user-name": customerName,
    };
    if (token) {
      reqHeaders.authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${BACKEND_URL}/api/appointments`, {
      method: "POST",
      headers: reqHeaders,
      body: JSON.stringify({
        serviceId: String(service._id),
        appointmentDate,
        timeSlot: cleanSlot,
        message: message ? message.trim() : "",
      }),
    });

    if (res.ok) {
      const data = await res.json();
      revalidatePath(`/services/${serviceId}`);
      revalidatePath("/dashboard/appointments");
      revalidatePath("/dashboard/admin/appointments");
      return {
        success: true,
        data: data.data,
        message: "Appointment request submitted successfully!",
      };
    }

    const errorPayload = await res.json().catch(() => null);
    if (errorPayload?.error) {
      throw new Error(errorPayload.error);
    }
  } catch (error) {
    // If backend returned a specific error message, bubble it up
    if (
      error instanceof Error &&
      error.message &&
      !error.message.includes("fetch failed")
    ) {
      throw error;
    }
    // Otherwise fallback to direct MongoDB
  }

  // Fallback to MongoDB
  const insertResult = await db
    .collection("appointments")
    .insertOne(newAppointment);

  revalidatePath(`/services/${serviceId}`);
  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard/admin/appointments");

  return {
    success: true,
    data: { _id: String(insertResult.insertedId), ...newAppointment },
    message: "Appointment request submitted successfully!",
  };
}

/**
 * Server action for a customer to cancel their own appointment request.
 * Rule: A customer can cancel only their own pending appointment requests.
 */
export async function cancelCustomerAppointmentAction(
  appointmentId: string,
  optionalToken?: string,
) {
  const session = await requireCustomerSession();
  const customerId = session.user.id;
  const customerEmail = session.user.email;

  if (!appointmentId || !ObjectId.isValid(appointmentId)) {
    throw new Error("Invalid appointment ID.");
  }

  const db = await getDb();
  const appointment = await db
    .collection("appointments")
    .findOne({ _id: new ObjectId(appointmentId) });

  if (!appointment) {
    throw new Error("Appointment not found.");
  }

  // Ownership check
  const isOwner =
    String(appointment.customerId) === String(customerId) ||
    appointment.customerEmail === customerEmail;

  if (!isOwner) {
    throw new Error(
      "Forbidden: You can only cancel your own appointment requests.",
    );
  }

  // Rule: A customer can cancel ONLY pending appointment requests
  if (appointment.status !== "pending") {
    throw new Error(
      "Only pending appointment requests can be cancelled online. Please contact the salon for confirmed bookings.",
    );
  }

  // Try backend first
  try {
    const token =
      optionalToken || (await getTokenFromServer().catch(() => null));
    const reqHeaders: Record<string, string> = {
      "x-user-role": "customer",
      "x-user-email": customerEmail,
      "x-user-id": customerId,
    };
    if (token) {
      reqHeaders.authorization = `Bearer ${token}`;
    }

    const res = await fetch(
      `${BACKEND_URL}/api/appointments/${appointmentId}/cancel`,
      {
        method: "PATCH",
        headers: reqHeaders,
      },
    );
    if (res.ok) {
      revalidatePath("/dashboard/customer/my-appoinmtments");
      revalidatePath("/dashboard/customer/my-appointments");
      revalidatePath("/dashboard/appointments");
      revalidatePath("/dashboard/admin/appointments");
      return { success: true, message: "Appointment cancelled successfully." };
    }
  } catch {
    // Fallback to DB
  }

  await db.collection("appointments").updateOne(
    { _id: new ObjectId(appointmentId) },
    {
      $set: {
        status: "cancelled",
        updatedAt: new Date(),
      },
    },
  );

  revalidatePath("/dashboard/customer/my-appoinmtments");
  revalidatePath("/dashboard/customer/my-appointments");
  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard/admin/appointments");

  return { success: true, message: "Appointment cancelled successfully." };
}

/**
 * Server action for an Admin to confirm or cancel appointment requests.
 * Rule: Admin can confirm or cancel appointment requests.
 */
export async function updateAppointmentStatusAction(
  appointmentId: string,
  status: "confirmed" | "cancelled",
  optionalToken?: string,
) {
  const session = await requireAdminSession();

  if (!appointmentId || !ObjectId.isValid(appointmentId)) {
    throw new Error("Invalid appointment ID.");
  }

  if (status !== "confirmed" && status !== "cancelled") {
    throw new Error("Status must be either 'confirmed' or 'cancelled'.");
  }

  const db = await getDb();
  const appointment = await db
    .collection("appointments")
    .findOne({ _id: new ObjectId(appointmentId) });

  if (!appointment) {
    throw new Error("Appointment not found.");
  }

  // Rule: Only pending appointments can be confirmed
  if (status === "confirmed" && appointment.status !== "pending") {
    throw new Error(
      `Only pending appointments can be confirmed. Current status is '${appointment.status}'.`,
    );
  }

  // Rule: Cannot cancel an already cancelled appointment
  if (status === "cancelled" && appointment.status === "cancelled") {
    throw new Error("This appointment is already cancelled.");
  }

  // Try backend first
  try {
    const token =
      optionalToken || (await getTokenFromServer().catch(() => null));
    const reqHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "x-user-role": "admin",
      "x-user-email": session.user.email,
    };
    if (token) {
      reqHeaders.authorization = `Bearer ${token}`;
    }

    const res = await fetch(
      `${BACKEND_URL}/api/appointments/${appointmentId}/status`,
      {
        method: "PATCH",
        headers: reqHeaders,
        body: JSON.stringify({ status }),
      },
    );
    if (res.ok) {
      revalidatePath("/dashboard/admin/appointments");
      revalidatePath("/dashboard/appointments");
      return {
        success: true,
        message: `Appointment successfully marked as ${status}.`,
      };
    }
    const errData = await res.json().catch(() => null);
    if (errData?.error) {
      throw new Error(errData.error);
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message &&
      !error.message.includes("fetch failed")
    ) {
      throw error;
    }
    // Fallback to direct DB
  }

  await db.collection("appointments").updateOne(
    { _id: new ObjectId(appointmentId) },
    {
      $set: {
        status,
        updatedAt: new Date(),
      },
    },
  );

  revalidatePath("/dashboard/admin/appointments");
  revalidatePath("/dashboard/appointments");

  return {
    success: true,
    message: `Appointment successfully marked as ${status}.`,
  };
}

/**
 * Server action for an Admin to fetch all appointments with optional filters.
 * Rule: Admin can manage all appointments.
 */
export async function fetchAdminAppointmentsAction(
  params?: AppointmentFilterParams,
): Promise<Appointment[]> {
  await requireAdminSession();
  return getAllAppointmentsForAdmin(params);
}

/**
 * Server action to fetch booked slots for a service and date.
 */
export async function fetchBookedSlotsAction(
  serviceId: string,
  date: string,
): Promise<string[]> {
  return getBookedSlots(serviceId, date);
}

/**
 * Server action to fetch the logged-in customer's appointments.
 */
export async function fetchCustomerAppointmentsAction(): Promise<
  Appointment[]
> {
  const session = await requireCustomerSession();
  return getCustomerAppointments(session.user.id, session.user.email);
}
