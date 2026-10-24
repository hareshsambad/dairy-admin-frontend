export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  dairyName: string;
  firstName?: string;
  lastName?: string;
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
  notificationChannel?: 'sms' | 'whatsapp' | string;
  email?: string;
  createdAt?: string;
  status?: 'Active' | 'Inactive' | 'Pending';
}

export interface CreateCustomerRequest {
  name: string;
  liters: number;
  price: number;
  phoneNumber?: string;
  notificationChannel?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  liters?: number;
  price?: number;
  phoneNumber?: string;
  notificationChannel?: string;
}

export interface MilkEntry {
  id: string;
  entryDate: string;
  liters: number;
  price: number;
  total: number;
  morningLiters?: number;
  morningPrice?: number;
  morningTotal?: number;
  eveningLiters?: number;
  eveningPrice?: number;
  eveningTotal?: number;
  notes?: string;
}

export interface CreateMilkEntryRequest {
  entryDate: string;
  liters: number;
  price: number;
}

export interface Distributor {
  id: string;
  email: string;
  dairyName: string;
  contact?: string;
  address?: string;
  customerCount?: number;
  monthlyBilling?: number;
  pendingBillsCount?: number;
  collectionRate?: number;
  status?: 'Active' | 'Review' | 'Inactive';
}

export interface CustomerBill {
  id: string;
  billNumber: string;
  period: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  dueDate: string;
  paidDate?: string | null;
  customerId: string;
  customerName?: string;
}

export interface CustomerWithBilling extends Customer {
  dailyAmount: number;
  monthlyEstimate: number;
  latestBill?: {
    billNumber: string;
    amount: number;
    status: 'Paid' | 'Pending' | 'Overdue';
    dueDate: string;
    paidDate?: string;
  };
  totalBilled?: number;
  lastPaymentDate?: string;
}
