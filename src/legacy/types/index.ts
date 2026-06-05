// V1 exact data models

export interface LegacyLead {
  id: string;
  conversationId: string;
  fullName: string;
  email: string;
  phone: string;
  source: string;
  businessType: string;
  leadScore: number;
  intent: "high" | "medium" | "low";
  urgency: "urgent" | "high" | "medium" | "low";
  status: "new" | "qualified" | "contacted" | "converted" | "lost";
  bookedCall: boolean;
  reminderSent: boolean;
  createdDate: string;
  lastContactTime: string;
  notes?: string;
  row?: number; // Kept for UI loop keying if needed, though V1 uses id
}

export interface LegacyConversation {
  id: string;
  leadId: string;
  sender: string;
  message: string;
  channel: string;
  messageType: string;
  timestamp: string;
  row?: number;
}

export interface LegacyAppointment {
  id: string;
  leadId: string;
  leadName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentStart?: string;
  appointmentEnd?: string;
  meetingLink: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no-show";
  reminderSent: boolean;
  notes?: string;
  row?: number;
}

export interface LegacyMemory {
  id: string;
  leadId: string;
  leadName: string;
  memoryType: "preference" | "behavior" | "context" | "intent" | "objection" | "timeline";
  memoryValue: string;
  lastUpdated: string;
  row?: number;
}

export interface LegacyFollowUp {
  id: string;
  leadId: string;
  leadName: string;
  followUpNumber: number;
  followUpMessage: string;
  scheduledTime: string;
  status: "pending" | "sent" | "completed" | "failed";
  messageSent: boolean;
  responseReceived: boolean;
  row?: number;
}

export interface LegacyBusinessKnowledge {
  id: string;
  businessName: string;
  services: string[];
  pricing: string;
  faqs: { question: string; answer: string }[];
  hours: string;
  policies: string;
  bookingLink: string;
  row?: number;
}

export interface LegacySettings {
  sheets_url?: string;
  sheets_client_id?: string;
  sheets_client_secret?: string;
  sheets_refresh_token?: string;
  telegram_bot_token?: string;
  telegram_webhook_url?: string;
  telegram_connected?: boolean;
}
