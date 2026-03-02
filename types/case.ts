export interface Case {
  _id?: string;
  lawyerId: string;
  title: string;
  caseNumber: string;
  caseType?: "Civil" | "Criminal" | "Family" | "Labour" | "Commercial" | "Constitutional" | "Tax" | "Other";
  client: {
    name: string;
    phone?: string;
    email?: string;
  };
  opponentName?: string;
  court?: string;
  status: "In Progress" | "Pending" | "Closed" | "Transferred";
  statusNotes?: string;
  nextHearing?: string;
  previousHearings?: string[]; // Added
  proceedingsHistory?: Array<{ date: string; notes: string; addedAt?: Date }>;
  proceedings?: string; // Added
  fees?: number; // Added
  createdAt?: Date;
  documents: string[];
  notes?: string;
}