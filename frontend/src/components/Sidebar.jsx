import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import useLayoutStore from "../store/layoutStore";
import useThemeStore from "../store/themeStore";
import useUserStore from "../store/UseUserStore";
import { FaCog } from "react-icons/fa";
import { motion } from "framer-motion";
import { TbGradienter } from "react-icons/tb";
import { CgProfile } from "react-icons/cg";
import sidebarLogoD from "../assets/logo-app-dark.png";
import sidebarLogoL from "../assets/logo-app-light.png";

const Sidebar = () => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { theme } = useThemeStore();
  const { user } = useUserStore((state) => state.user); // ✅ fixed
  const { activeTab, setActiveTab, selectedContact } = useLayoutStore();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (location.pathname === "/") setActiveTab("chats");
    else if (location.pathname === "/status") setActiveTab("status");
    else if (location.pathname === "/user-profile")
      setActiveTab("user-profile");
    else if (location.pathname === "/settings") setActiveTab("settings");
  }, [location.pathname, setActiveTab]);

  if (isMobile && selectedContact) return null;

  const getIconStyle = (tab) =>
    `${
      activeTab === tab
        ? theme === "dark"
          ? "bg-gray-200 text-gray-800"
          : "bg-gray-300 text-gray-900"
        : theme === "dark"
        ? "text-gray-300"
        : "text-gray-800"
    } p-2 rounded-full transition-colors duration-200`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`${
        isMobile
          ? "fixed bottom-0 left-0 h-16 w-full"
          : "w-16 h-screen border-r-2"
      } ${
        theme === "dark"
          ? "bg-gray-800 border-gray-600"
          : "bg-[rgb(239,242,254)] border-gray-200"
      } flex items-center ${
        isMobile ? "flex-row justify-around" : "flex-col py-4 justify-between"
      } shadow-lg z-40`}
    >
      {/* Logo / Chats */}
      <Link to="/" className={getIconStyle("chats")}>
        <img
          src={theme === "dark" ? sidebarLogoL : sidebarLogoD}
          alt="App Logo"
          className="h-6 w-6"
        />
      </Link>

      {/* Status */}
      <Link to="/status" className={getIconStyle("status")}>
        <TbGradienter className="h-6 w-6 mt-2" />
      </Link>

      {/* Spacer on desktop */}
      {!isMobile && <div className="grow" />}

      {/* User Profile */}
      <Link to="/user-profile" className={getIconStyle("user-profile")}>
        {user?.profilePicture ? (
          <img
            src={user.profilePicture}
            alt="Profile"
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : (
          <CgProfile className="h-6 w-6" />
        )}
      </Link>

      {/* Settings */}
      <Link to="/settings" className={getIconStyle("settings")}>
        <FaCog className="h-6 w-6" />
      </Link>
    </motion.div>
  );
};

export default Sidebar;
