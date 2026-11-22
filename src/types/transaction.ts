export type TransactionStatus = "paid" | "failed";

export interface Transaction {
  _id: string;
  appointmentId: string;
  customerId: string;
  amount: number;
  currency: string;
  stripeSessionId: string;
  status: TransactionStatus;
  createdAt: string | Date;

  // Enriched presentation fields
  customerName?: string;
  customerEmail?: string;
  customerImage?: string;
  serviceName?: string;
  serviceCategory?: string;
  serviceImage?: string;
  appointmentDate?: string;
  timeSlot?: string;
}

export interface CreateTransactionInput {
  appointmentId: string;
  customerId: string;
  amount: number;
  currency: string;
  stripeSessionId: string;
  status: TransactionStatus;
}
