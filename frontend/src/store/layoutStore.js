import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useLayoutStore = create(
  persist(
    (set) => ({
      activeTab: "chats",
      selectedContact: null,
      setSelectedContact: (contact) => set({ selectedContact: contact }),
      clearSelectedContact: () => set({ selectedContact: null }),
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: "layout-storage",
      storage: createJSONStorage(() => localStorage),
      // Don't persist selected contact — avoids hydration races and stale selection
      partialize: (state) => ({ activeTab: state.activeTab }),
    },
  ),
);

export default useLayoutStore;
