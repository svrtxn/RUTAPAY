export interface Trip {
  id: string;
  date: string;
  origin: string;
  destination: string;
  amount: number;
}

export type Screen = "dashboard" | "new-trip" | "history" | "settings" | "admin-drivers";
export type ToastType = "success" | "error";

export interface AuthUser {
  id: string;
  phone: string;
  email?: string;
  name: string;
  role: string;
}
