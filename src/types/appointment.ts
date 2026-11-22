export const APPOINTMENT_TIME_SLOTS = [
  "09:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 PM - 01:00 PM",
  "02:00 PM - 03:00 PM",
  "03:00 PM - 04:00 PM",
  "04:00 PM - 05:00 PM",
  "05:00 PM - 06:00 PM",
  "06:00 PM - 07:00 PM",
] as const;

export type AppointmentTimeSlot = (typeof APPOINTMENT_TIME_SLOTS)[number];

export type AppointmentStatus = "pending" | "confirmed" | "cancelled";
export type PaymentStatus = "unpaid" | "paid";

export interface Appointment {
  _id: string;
  serviceId: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  serviceName?: string;
  serviceImage?: string;
  serviceCategory?: string;
  servicePrice: number;
  appointmentDate: string; // Format: YYYY-MM-DD
  timeSlot: string;
  message?: string;
  paymentStatus: PaymentStatus;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateAppointmentInput {
  serviceId: string;
  appointmentDate: string;
  timeSlot: string;
  message?: string;
  token?: string;
}

export interface AppointmentFilterParams {
  customerId?: string;
  serviceId?: string;
  status?: AppointmentStatus | "all";
  date?: string;
}
