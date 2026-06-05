import { create } from 'zustand';
import { 
  LegacyLead, 
  LegacyConversation, 
  LegacyAppointment, 
  LegacyMemory, 
  LegacyFollowUp, 
  LegacyBusinessKnowledge 
} from '../types';

interface LegacyState {
  leads: LegacyLead[];
  conversations: LegacyConversation[];
  appointments: LegacyAppointment[];
  memory: LegacyMemory[];
  followUps: LegacyFollowUp[];
  knowledge: LegacyBusinessKnowledge[];
  isLoading: boolean;
  error: string | null;
  lastSynced: string | null;
  setLeads: (leads: LegacyLead[]) => void;
  setConversations: (conversations: LegacyConversation[]) => void;
  setAppointments: (appointments: LegacyAppointment[]) => void;
  setMemory: (memory: LegacyMemory[]) => void;
  setFollowUps: (followUps: LegacyFollowUp[]) => void;
  setKnowledge: (knowledge: LegacyBusinessKnowledge[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setLastSynced: (lastSynced: string) => void;
  refreshData: () => Promise<void>;
}

export const useLegacyStore = create<LegacyState>((set) => ({
  leads: [],
  conversations: [],
  appointments: [],
  memory: [],
  followUps: [],
  knowledge: [],
  isLoading: false,
  error: null,
  lastSynced: null,
  
  setLeads: (leads) => set({ leads }),
  setConversations: (conversations) => set({ conversations }),
  setAppointments: (appointments) => set({ appointments }),
  setMemory: (memory) => set({ memory }),
  setFollowUps: (followUps) => set({ followUps }),
  setKnowledge: (knowledge) => set({ knowledge }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setLastSynced: (lastSynced) => set({ lastSynced }),

  refreshData: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/legacy/refresh');
      if (!response.ok) {
        throw new Error('Failed to fetch data from sheets');
      }
      const data = await response.json();
      
      set({
        leads: data.leads || [],
        conversations: data.conversations || [],
        appointments: data.appointments || [],
        memory: data.memory || [],
        followUps: data.followUps || [],
        knowledge: data.knowledge || [],
        lastSynced: new Date().toISOString()
      });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  }
}));
