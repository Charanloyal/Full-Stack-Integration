import { create } from 'zustand';

export type TabType = 'tasks' | 'chat' | 'profile' | 'logs' | 'analytics';
export type PriorityFilterType = 'ALL' | 'LOW' | 'MEDIUM' | 'HIGH';

interface UIState {
  activeTab: TabType;
  searchQuery: string;
  priorityFilter: PriorityFilterType;
  assigneeFilter: string; // 'ALL' or user ID
  
  setActiveTab: (tab: TabType) => void;
  setSearchQuery: (query: string) => void;
  setPriorityFilter: (filter: PriorityFilterType) => void;
  setAssigneeFilter: (filter: string) => void;
  resetFilters: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'tasks',
  searchQuery: '',
  priorityFilter: 'ALL',
  assigneeFilter: 'ALL',

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setPriorityFilter: (filter) => set({ priorityFilter: filter }),
  setAssigneeFilter: (filter) => set({ assigneeFilter: filter }),
  resetFilters: () => set({ searchQuery: '', priorityFilter: 'ALL', assigneeFilter: 'ALL' }),
}));
