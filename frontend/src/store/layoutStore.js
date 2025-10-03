import { create } from "zustand";
import { persist } from "zustand/middleware";

const useLayoutStore = create(
  persist(
    (set) => ({
      activeTabs: "chats",
      selectedContact: null,
      setSelectedContact : (contact) => set({ setSelectedContact: contact }),
      setActiveTab: (tab) => set({activeTab: tab}), 
    }),
    {
      name: "layout-storage",
      getStorage: () => localStorage,
    }
  )
);

export default useLayoutStore;
