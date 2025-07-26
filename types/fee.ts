export interface Fee {
  _id?: string;
  lawyerId: string;
  caseId:
    | {
        _id: string;
        title: string;
        caseNumber: string;
        client: {
          name: string;
          phone?: string;
          email?: string;
        };
        opponentName?: string;
      }
    | string;
  totalFee: number;
  paidAmount: number;
  pendingAmount: number;
  status: "Pending" | "Partial" | "Completed";
  paymentMethod?: string;
  transactionId?: string;
  lastPayment?: string;
  createdAt?: Date;
}
