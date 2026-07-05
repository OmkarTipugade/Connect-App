import { useEffect, useState } from "react";
import useLayoutStore from "../store/layoutStore";
import useThemeStore from "../store/themeStore";
import Sidebar from "./Sidebar";
import ChatWindow from "../pages/chats/ChatWindow";

const Layout = ({ children, isThemeDialogOpen, toggleThemeDialog }) => {
  const selectedContact = useLayoutStore((state) => state.selectedContact);
  const setSelectedContact = useLayoutStore(
    (state) => state.setSelectedContact,
  );
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const showChatList = !isMobile || !selectedContact;
  const showChatWindow = !isMobile || Boolean(selectedContact);

  return (
    <div
      className={`h-[100dvh] ${
        theme === "dark" ? "bg-[#111b21] text-white" : "bg-gray-200 text-black"
      } flex relative overflow-hidden`}
    >
      {!isMobile && <Sidebar />}

      <div className="flex flex-1 min-w-0 overflow-hidden">
        <div
          className={`${
            showChatList ? "flex" : "hidden"
          } ${isMobile ? "w-full pb-16" : "w-2/5 max-w-md shrink-0"} flex-col overflow-hidden border-r ${
            theme === "dark" ? "border-gray-700" : "border-gray-300"
          }`}
        >
          {children}
        </div>

        <div
          className={`${
            showChatWindow ? "flex" : "hidden"
          } flex-1 min-w-0 flex-col overflow-hidden`}
        >
          <ChatWindow
            setSelectedContact={setSelectedContact}
            isMobile={isMobile}
          />
        </div>
      </div>

      {isMobile && <Sidebar />}

      {isThemeDialogOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div
            className={`${
              theme === "dark"
                ? "bg-[#202c33] text-white"
                : "bg-gray-100 text-black"
            } p-6 rounded-lg shadow-lg max-w-sm w-full`}
          >
            <h2 className="text-2xl font-semibold mb-4">Choose a theme</h2>
            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  value="light"
                  checked={theme === "light"}
                  onChange={() => setTheme("light")}
                  className="form-radio text-blue-600"
                />
                <span>Light</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  value="dark"
                  checked={theme === "dark"}
                  onChange={() => setTheme("dark")}
                  className="form-radio text-blue-600"
                />
                <span>Dark</span>
              </label>
              <button
                onClick={toggleThemeDialog}
                className="mt-6 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition duration-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
