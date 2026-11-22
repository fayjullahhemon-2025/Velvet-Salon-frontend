export type ServiceCategory =
  | "Haircut & Styling"
  | "Hair Coloring"
  | "Hair Treatment"
  | "Facial & Skincare"
  | "Makeup"
  | "Manicure & Pedicure"
  | "Spa & Massage"
  | string;

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  "Haircut & Styling",
  "Hair Coloring",
  "Hair Treatment",
  "Facial & Skincare",
  "Makeup",
  "Manicure & Pedicure",
  "Spa & Massage",
];

export type ServiceStatus = "active" | "inactive";

export interface Service {
  _id: string;
  serviceName: string;
  category: ServiceCategory;
  description: string;
  price: number;
  duration: number; // in minutes
  image: string;
  status: ServiceStatus;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ServiceInput {
  serviceName: string;
  category: string;
  description: string;
  price: number;
  duration: number;
  image: string;
  status?: ServiceStatus;
}

export type ServiceSortOption =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "duration_asc"
  | "duration_desc"
  | "name_asc"
  | "name_desc";

export interface ServiceFilterParams {
  status?: "active" | "inactive" | "all";
  category?: string;
  search?: string;
  sort?: ServiceSortOption;
  limit?: number;
}
