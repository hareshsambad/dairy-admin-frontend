export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  dairyName: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface Customer {
  id: string;
  name: string;
  uniqueNumber: string;
  liters: number;
  price: number;
  phoneNumber?: string;
  notificationChannel?: string;
}

export interface CreateCustomerRequest {
  name: string;
  liters: number;
  price: number;
}

export interface Distributor {
  id: string;
  email: string;
  dairyName: string;
}

export interface CustomerWithBilling extends Customer {
  dailyAmount: number;
  monthlyEstimate: number;
}
