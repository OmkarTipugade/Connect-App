import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const getSystemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const resolveTheme = (preference) =>
  preference === "system" ? getSystemTheme() : preference;

const applyTheme = (preference) => {
  const resolved = resolveTheme(preference);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.setAttribute("data-theme", resolved);
  return resolved;
};

const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: "light",
      preference: "light",
      setTheme: (preference) => {
        applyTheme(preference);
        set({
          preference,
          theme: resolveTheme(preference),
        });
      },
      initTheme: () => {
        const { preference } = get();
        const resolved = applyTheme(preference || get().theme);
        set({ theme: resolved });
      },
    }),
    {
      name: "theme-storage",
      getStorage: () => localStorage,
    },
  ),
);

export const useThemeInit = () => {
  const initTheme = useThemeStore((s) => s.initTheme);
  const preference = useThemeStore((s) => s.preference);

  useEffect(() => {
    initTheme();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (useThemeStore.getState().preference === "system") {
        useThemeStore.getState().setTheme("system");
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [initTheme, preference]);
};

export default useThemeStore;
