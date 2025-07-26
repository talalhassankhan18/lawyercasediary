export interface Case {
  _id?: string;
  lawyerId: string;
  title: string;
  caseNumber: string;
  client: {
    name: string;
    phone?: string;
    email?: string;
  };
  opponentName?: string;
  court?: string;
  status: "In Progress" | "Pending" | "Closed";
  nextHearing?: string;
  createdAt?: Date;
  documents: string[];
  notes?: string;
}
