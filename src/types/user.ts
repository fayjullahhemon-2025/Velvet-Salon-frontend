export type UserRole = "admin" | "customer";

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  image?: string;
  phone?: string;
  role: UserRole;
  isBlocked: boolean;
  createdAt?: string;
  totalAppointments?: number;
}

export interface UpdateProfileInput {
  name?: string;
  image?: string;
  phone?: string;
}

export interface UserFilterParams {
  role?: UserRole | "all";
  status?: "active" | "blocked" | "all";
  search?: string;
}
