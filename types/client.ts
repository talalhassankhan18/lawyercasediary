export interface Client {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  caseType?: string;
  status: 'Active' | 'Completed';
  joinDate?: string;
  totalCases: number;
  pendingPayment: number;
  lastContact?: string;
  nextHearing?: string;
  cases: Case[];
}

export interface Case {
  _id?: string;
  title: string;
  caseNumber: string;
  client: {
    name: string;
    phone?: string;
    email?: string;
  };
  court?: string;
  fee: {
    total: number;
    paid: number;
    pending: number;
    status: 'Completed' | 'Partial' | 'Pending';
  };
  status: 'In Progress' | 'Pending' | 'Closed';
  nextHearing?: string;
  createdAt?: string;
  updatedAt?: string; // Added if backend provides this
  documents?: string[];
  notes?: string;
}