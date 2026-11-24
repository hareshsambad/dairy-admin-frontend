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
  name?: string;
  role?: string;
  phoneNumber?: string;
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

export interface PlatformStats {
  totalDistributors: number;
  activeDistributors: number;
  inactiveDistributors: number;
  totalCustomers: number;
  activeCustomers: number;
  totalMilkLiters: number;
  totalMilkCollection: number;
  totalMilkValue: number;
  totalTransactions: number;
  totalPaymentsReceived: number;
  totalOutstandingAmount: number;
  recentActivity: Array<{
    id: string;
    type: string;
    date: string;
    liters: number;
    price: number;
    total: number;
  }>;
}

export interface DistributorDetailData {
  distributor: {
    did: string;
    id: string;
    dairyName: string;
    isActive: boolean;
    createdAt?: string;
    user: {
      uid: string;
      name: string;
      email: string;
      phoneNumber: string;
      isActive: boolean;
    };
  };
  overview: {
    totalCustomers: number;
    activeCustomers: number;
    totalMilkLiters: number;
    totalMilkAmount: number;
    totalPaymentsReceived: number;
    outstandingBalance: number;
  };
  customers: Array<{
    cid: string;
    id: string;
    uniqueNumber: string;
    name: string;
    phoneNumber: string;
    liters: number;
    price: number;
    isActive: boolean;
    notificationChannel?: string;
  }>;
}

export interface CustomerDetailData {
  customer: {
    cid: string;
    id: string;
    name: string;
    uniqueNumber: string;
    phoneNumber: string;
    liters: number;
    price: number;
    notificationChannel?: string;
    isActive: boolean;
  };
  distributor: {
    did: string;
    id: string;
    dairyName: string;
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string;
  };
  summary: {
    totalLiters: number;
    totalBilled: number;
    totalPaid: number;
    outstandingBalance: number;
  };
  milkEntries: Array<{
    id: string;
    eid: string;
    entryDate: string;
    liters: number;
    price: number;
    total: number;
  }>;
  payments: Array<{
    id: string;
    pid: string;
    year: number;
    month: number;
    period: string;
    billAmount: number;
    receivedAmount: number;
    receivedDate: string;
    note?: string;
  }>;
  monthlyBills: Array<{
    period: string;
    liters: number;
    billedAmount: number;
    paidAmount: number;
    dueAmount: number;
    status: 'Paid' | 'Partial' | 'Pending';
    entriesCount: number;
  }>;
}

export interface TransactionItem {
  id: string;
  pid: string;
  year: number;
  month: number;
  period: string;
  billAmount: number;
  receivedAmount: number;
  balance: number;
  note: string;
  receivedDate: string;
  createdAt: string;
  customer: {
    cid: string;
    name: string;
    uniqueNumber: string;
    phoneNumber: string;
  };
  distributor: {
    did: string;
    dairyName: string;
  };
}
