import { type Document, type Filter, ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import type { Appointment } from "@/types/appointment";
import type { Transaction } from "@/types/transaction";

export interface CreateCheckoutParams {
  appointmentId: string;
  userEmail: string;
  userId?: string;
  origin: string;
}

export interface CreateCheckoutResult {
  success: boolean;
  url?: string;
  sessionId?: string;
  error?: string;
}

export interface VerifyPaymentResult {
  success: boolean;
  appointment?: Appointment;
  transaction?: Transaction;
  session?: {
    id: string;
    amountTotal: number;
    currency: string;
    customerEmail?: string;
    status?: string;
  };
  error?: string;
}

/**
 * Creates a Stripe Checkout Session for a confirmed + unpaid appointment.
 */
export async function createCheckoutSessionForAppointment({
  appointmentId,
  userEmail,
  userId,
  origin,
}: CreateCheckoutParams): Promise<CreateCheckoutResult> {
  if (!appointmentId) {
    return { success: false, error: "Appointment ID is required." };
  }

  try {
    const db = await getDb();
    const query: Filter<Document> = ObjectId.isValid(appointmentId)
      ? {
          $or: [
            { _id: new ObjectId(appointmentId) },
            { _id: appointmentId as unknown as ObjectId },
          ],
        }
      : { _id: appointmentId as unknown as ObjectId };

    const appointment = await db.collection("appointments").findOne(query);

    if (!appointment) {
      return { success: false, error: "Appointment not found." };
    }

    // Rule: Customers cannot pay for cancelled or pending appointments.
    if (appointment.status !== "confirmed") {
      return {
        success: false,
        error: "Only confirmed appointments can be paid for.",
      };
    }

    // Rule: Cannot pay if already paid.
    if (appointment.paymentStatus === "paid") {
      return {
        success: false,
        error: "This appointment has already been paid for.",
      };
    }

    // Ownership check: Caller must own this appointment
    const appointmentCustomerId = String(appointment.customerId ?? "");
    const appointmentCustomerEmail = String(appointment.customerEmail ?? "");
    const matchesUser =
      (userId && appointmentCustomerId === String(userId)) ||
      (userEmail &&
        appointmentCustomerEmail.toLowerCase() === userEmail.toLowerCase()) ||
      (userEmail &&
        appointmentCustomerId.toLowerCase() === userEmail.toLowerCase());

    if (!matchesUser) {
      return {
        success: false,
        error: "Unauthorized: You do not own this appointment.",
      };
    }

    // Fetch service info if needed
    let serviceName = String(appointment.serviceName ?? "Salon Service");
    let servicePrice = Number(appointment.servicePrice ?? 0);
    if ((!serviceName || !servicePrice) && appointment.serviceId) {
      const sId = String(appointment.serviceId);
      const sQuery: Filter<Document> = ObjectId.isValid(sId)
        ? {
            $or: [
              { _id: new ObjectId(sId) },
              { _id: sId as unknown as ObjectId },
            ],
          }
        : { _id: sId as unknown as ObjectId };

      const sDoc = await db.collection("services").findOne(sQuery);
      if (sDoc) {
        serviceName = String(sDoc.serviceName || serviceName);
        servicePrice = Number(sDoc.price || servicePrice);
      }
    }

    const priceId = process.env.STRIPE_PRICE_ID?.trim();
    const integrationId = process.env.STRIPE_INTEGRATION_IDENTIFIER?.trim();

    // Use predefined Price ID from .env if present, otherwise build dynamic price item
    const line_items = priceId
      ? [
          {
            price: priceId,
            quantity: 1,
          },
        ]
      : [
          {
            price_data: {
              currency: "usd",
              unit_amount: Math.max(100, Math.round(servicePrice * 100)),
              product_data: {
                name: serviceName,
                description: `Appointment on ${appointment.appointmentDate} at ${appointment.timeSlot}`,
              },
            },
            quantity: 1,
          },
        ];

    const cleanOrigin = origin.replace(/\/+$/, "");

    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${cleanOrigin}/success?session_id={CHECKOUT_SESSION_ID}&appointment_id=${String(appointment._id)}`,
      cancel_url: `${cleanOrigin}/cancel?appointment_id=${String(appointment._id)}`,
      customer_email: userEmail || undefined,
      metadata: {
        appointmentId: String(appointment._id),
        customerId: String(appointment.customerId || userId || ""),
        customerEmail: userEmail || "",
        serviceName: serviceName,
        servicePrice: String(servicePrice),
      },
      ...(integrationId ? { integration_identifier: integrationId } : {}),
    });

    if (!session.url) {
      return { success: false, error: "Failed to generate checkout URL." };
    }

    return {
      success: true,
      url: session.url,
      sessionId: session.id,
    };
  } catch (error) {
    console.error("Error creating Stripe checkout session:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while creating the checkout session.",
    };
  }
}

/**
 * Verifies a Stripe Checkout Session, updates appointment paymentStatus to 'paid',
 * and records the transaction in the 'transactions' collection idempotently.
 */
export async function verifyAndProcessStripePayment(
  sessionId: string,
): Promise<VerifyPaymentResult> {
  if (!sessionId) {
    return { success: false, error: "Session ID is required." };
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    const isPaid =
      session.payment_status === "paid" || session.status === "complete";
    if (!isPaid) {
      return {
        success: false,
        error: "Payment has not been completed for this session.",
      };
    }

    const appointmentId = session.metadata?.appointmentId;
    if (!appointmentId) {
      return {
        success: false,
        error: "No appointment associated with this payment session.",
      };
    }

    const db = await getDb();
    const appQuery: Filter<Document> = ObjectId.isValid(appointmentId)
      ? {
          $or: [
            { _id: new ObjectId(appointmentId) },
            { _id: appointmentId as unknown as ObjectId },
          ],
        }
      : { _id: appointmentId as unknown as ObjectId };

    const appointment = await db.collection("appointments").findOne(appQuery);
    if (!appointment) {
      return { success: false, error: "Referenced appointment was not found." };
    }

    // 1. Update appointment payment status to 'paid'
    await db.collection("appointments").updateOne(appQuery, {
      $set: {
        paymentStatus: "paid",
        updatedAt: new Date(),
      },
    });

    // 2. Save transaction to 'transactions' collection idempotently
    const existingTransaction = await db
      .collection("transactions")
      .findOne({ stripeSessionId: session.id });

    let transactionDoc = existingTransaction;

    if (!existingTransaction) {
      const amountTotal = (session.amount_total ?? 0) / 100;
      const finalAmount =
        amountTotal > 0 ? amountTotal : Number(appointment.servicePrice ?? 0);

      const newTx = {
        appointmentId: String(appointment._id),
        customerId: String(
          appointment.customerId || session.metadata?.customerId || "",
        ),
        amount: finalAmount,
        currency: session.currency || "usd",
        stripeSessionId: session.id,
        status: "paid",
        createdAt: new Date(),
      };

      const insertResult = await db.collection("transactions").insertOne(newTx);
      transactionDoc = { ...newTx, _id: insertResult.insertedId };
    }

    const normalizedAppointment: Appointment = {
      _id: String(appointment._id),
      serviceId: String(appointment.serviceId),
      serviceName: String(
        appointment.serviceName ??
          session.metadata?.serviceName ??
          "Salon Service",
      ),
      serviceCategory: String(appointment.serviceCategory ?? ""),
      servicePrice: Number(appointment.servicePrice ?? 0),
      serviceImage: String(appointment.serviceImage ?? ""),
      customerId: String(appointment.customerId),
      customerName: String(appointment.customerName ?? ""),
      customerEmail: String(
        appointment.customerEmail ?? session.customer_details?.email ?? "",
      ),
      appointmentDate: String(appointment.appointmentDate),
      timeSlot: String(appointment.timeSlot),
      message: appointment.message ? String(appointment.message) : undefined,
      paymentStatus: "paid",
      status: appointment.status,
      createdAt:
        appointment.createdAt instanceof Date
          ? appointment.createdAt.toISOString()
          : String(appointment.createdAt ?? new Date().toISOString()),
    };

    const normalizedTransaction: Transaction = {
      _id: String(transactionDoc?._id ?? ""),
      appointmentId: String(transactionDoc?.appointmentId ?? appointment._id),
      customerId: String(transactionDoc?.customerId ?? appointment.customerId),
      amount: Number(
        transactionDoc?.amount ?? (session.amount_total ?? 0) / 100,
      ),
      currency: String(transactionDoc?.currency ?? "usd"),
      stripeSessionId: session.id,
      status: "paid",
      createdAt:
        transactionDoc?.createdAt instanceof Date
          ? transactionDoc.createdAt.toISOString()
          : String(transactionDoc?.createdAt ?? new Date().toISOString()),
      serviceName: normalizedAppointment.serviceName,
      appointmentDate: normalizedAppointment.appointmentDate,
      timeSlot: normalizedAppointment.timeSlot,
      customerEmail: normalizedAppointment.customerEmail,
    };

    return {
      success: true,
      appointment: normalizedAppointment,
      transaction: normalizedTransaction,
      session: {
        id: session.id,
        amountTotal: (session.amount_total ?? 0) / 100,
        currency: session.currency || "usd",
        customerEmail: session.customer_details?.email || undefined,
        status: session.status || "complete",
      },
    };
  } catch (error) {
    console.error("Error verifying Stripe session:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to verify payment session.",
    };
  }
}
