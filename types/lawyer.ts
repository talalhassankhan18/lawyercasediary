export interface Lawyer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  firmName: string;
  phoneNumber: string;
  feeSecurityKey: string;
  profilePicture?: string;
  verificationCode?: string;
  verificationCodeExpires?: Date;
  isVerified: boolean;
  subscription: {
    plan: string;
    status: "Active" | "Pending" | "Cancelled";
    trialEnd?: Date;
  };
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  loginAlerts: boolean;
  createdAt: Date;
}
