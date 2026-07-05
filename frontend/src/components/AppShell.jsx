import { useEffect, useState } from "react";
import useThemeStore from "../store/themeStore";
import Sidebar from "./Sidebar";

const AppShell = ({ children, title }) => {
  const { theme } = useThemeStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className={`min-h-screen flex ${
        theme === "dark" ? "bg-[#111b21] text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      {!isMobile && <Sidebar />}
      <div className={`flex-1 flex flex-col overflow-hidden ${isMobile ? "pb-16" : ""}`}>
        {title && (
          <div
            className={`px-4 py-4 border-b ${
              theme === "dark" ? "border-gray-700 bg-[#202c33]" : "border-gray-200 bg-white"
            }`}
          >
            <h1 className="text-xl font-semibold">{title}</h1>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
      {isMobile && <Sidebar />}
    </div>
  );
};

export default AppShell;
