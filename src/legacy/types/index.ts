// V1 exact data models

export interface LegacyLead {
  row: number;
  date: string;
  fullName: string;
  email: string;
  phone: string;
  source: string;
  businessName: string;
  businessType: string;
  leadScore: string;
  status: string;
  intent: string;
  urgency: string;
  aiSummary: string;
  recommendedAction: string;
  lastContactDate: string;
  nextFollowUpDate: string;
  conversationId: string;
  assignedTo: string;
  tags: string;
  notes: string;
}

export interface LegacyConversation {
  row: number;
  timestamp: string;
  conversationId: string;
  sender: 'ai' | 'lead' | 'human';
  message: string;
  platform: string;
  status: string;
}

export interface LegacyAppointment {
  row: number;
  dateCreated: string;
  appointmentDate: string;
  appointmentTime: string;
  leadName: string;
  leadPhone: string;
  leadEmail: string;
  status: string;
  notes: string;
  meetingLink: string;
  googleEventId: string;
}

export interface LegacyMemory {
  row: number;
  dateAdded: string;
  leadName: string;
  leadPhone: string;
  memoryType: string;
  content: string;
  source: string;
  confidenceScore: string;
}

export interface LegacyFollowUp {
  row: number;
  dateCreated: string;
  scheduledDate: string;
  scheduledTime: string;
  leadName: string;
  leadPhone: string;
  messageTemplate: string;
  status: string;
  actualSentTime: string;
}

export interface LegacyBusinessKnowledge {
  row: number;
  category: string;
  key: string;
  value: string;
  lastUpdated: string;
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
