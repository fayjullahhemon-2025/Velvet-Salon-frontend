import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { verifyAndProcessStripePayment } from "@/lib/api/payment";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(
          rawBody,
          signature,
          webhookSecret,
        );
      } catch (err) {
        console.error("Stripe webhook signature verification failed:", err);
        return NextResponse.json(
          { error: "Webhook signature verification failed" },
          { status: 400 },
        );
      }
    } else {
      // In local dev without Stripe CLI webhook secret, parse JSON payload directly
      try {
        event = JSON.parse(rawBody) as Stripe.Event;
      } catch {
        return NextResponse.json(
          { error: "Invalid JSON payload" },
          { status: 400 },
        );
      }
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session?.id) {
        await verifyAndProcessStripePayment(session.id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing Stripe webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
