export interface Calendar {
  id?: string;
  lawyerId?: string;
  type: "event" | "holiday" | "slot" | "schedule";
  event?: {
    title: string;
    client: string;
    eventType: "hearing" | "consultation" | "meeting" | "deadline";
    date: string;
    time: string;
    location?: string;
    notes?: string;
    status: "pending" | "confirmed" | "closed";
    caseDetails?: {
      caseNumber: string;
      opponentName: string;
    };
  };
  holiday?: {
    date: string;
    name: string;
  };
  slot?: {
    date: string;
    slots: string[];
  };
  schedule?: {
    monday: { available: boolean; hours: string[] };
    tuesday: { available: boolean; hours: string[] };
    wednesday: { available: boolean; hours: string[] };
    thursday: { available: boolean; hours: string[] };
    friday: { available: boolean; hours: string[] };
    saturday: { available: boolean; hours: string[] };
  };
  createdAt?: Date;
}

export interface CalendarEvent {
  id?: string;
  lawyerId: string;
  title: string;
  client: string;
  eventType: "hearing" | "consultation" | "meeting" | "deadline";
  date: string;
  time: string;
  location?: string;
  notes?: string;
  status: "pending" | "confirmed" | "closed";
  createdAt?: Date;
  caseDetails?: {
    caseNumber: string;
    opponentName: string;
  };
}

export interface Holiday {
  id?: string;
  date: string;
  name: string;
}

export interface AvailableSlot {
  id?: string;
  lawyerId: string;
  date: string;
  slots: string[];
}

export interface WeeklySchedule {
  id?: string;
  lawyerId: string;
  monday: { available: boolean; hours: string[] };
  tuesday: { available: boolean; hours: string[] };
  wednesday: { available: boolean; hours: string[] };
  thursday: { available: boolean; hours: string[] };
  friday: { available: boolean; hours: string[] };
  saturday: { available: boolean; hours: string[] };
}

export interface Lawyer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  firmName: string;
  phoneNumber: string;
}
