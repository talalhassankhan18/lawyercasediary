import { Case } from './case';

export interface Client {
  name: string;
  email: string;
  phone: string;
  address: string;
  caseType: string;
  status: 'Active' | 'Completed';
  joinDate?: string; // Use caseNumber as a proxy or leave undefined if no date is available
  totalCases: number;
  pendingPayment: number;
  lastContact?: string; // Use nextHearing as a fallback or leave undefined
  nextHearing?: string;
  cases: Case[];
}