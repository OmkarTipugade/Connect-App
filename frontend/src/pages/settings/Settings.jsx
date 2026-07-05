import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaPalette,
  FaBell,
  FaInfoCircle,
  FaSignOutAlt,
  FaStar,
  FaShieldAlt,
  FaHdd,
} from "react-icons/fa";
import { toast } from "react-toastify";
import AppShell from "../../components/AppShell";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/UseUserStore";
import { useChatStore } from "../../store/chatStore";
import { logoutUser } from "../../services/user.service";
import { disconnectSocket } from "../../services/chat.service";

const SettingRow = ({ icon: Icon, label, description, onClick, danger }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-4 p-4 rounded-xl transition text-left ${
      danger
        ? "hover:bg-red-500/10 text-red-500"
        : "hover:bg-black/5 dark:hover:bg-white/5"
    }`}
  >
    <div
      className={`p-2.5 rounded-full ${
        danger ? "bg-red-500/10" : "bg-red-500/10 text-red-500"
      }`}
    >
      <Icon className="w-4 h-4" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium text-sm">{label}</p>
      {description && (
        <p className="text-xs opacity-60 truncate">{description}</p>
      )}
    </div>
    <span className="opacity-40">›</span>
  </button>
);

const Settings = () => {
  const navigate = useNavigate();
  const { preference, setTheme, theme } = useThemeStore();
  const clearUser = useUserStore((state) => state.clearUser);
  const cleanup = useChatStore((state) => state.cleanup);
  const [showTheme, setShowTheme] = useState(false);
  const [notifications, setNotifications] = useState(
    () => localStorage.getItem("notifications-enabled") !== "false",
  );
  const [autoDownload, setAutoDownload] = useState(
    () => localStorage.getItem("auto-download-media") !== "false",
  );

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // proceed with local logout even if API fails
    }
    cleanup();
    disconnectSocket();
    clearUser();
    toast.success("Logged out");
    navigate("/user-login");
  };

  const toggleNotifications = () => {
    const next = !notifications;
    setNotifications(next);
    localStorage.setItem("notifications-enabled", String(next));
    toast.success(next ? "Notifications enabled" : "Notifications disabled");
  };

  const toggleAutoDownload = () => {
    const next = !autoDownload;
    setAutoDownload(next);
    localStorage.setItem("auto-download-media", String(next));
    toast.success(next ? "Auto-download enabled" : "Auto-download disabled");
  };

  const cardClass =
    theme === "dark"
      ? "bg-[#202c33] rounded-2xl overflow-hidden"
      : "bg-white rounded-2xl shadow-sm overflow-hidden";

  return (
    <AppShell title="Settings">
      <div className="max-w-lg mx-auto p-4 space-y-4">
        <div className={cardClass}>
          <SettingRow
            icon={FaUser}
            label="Profile"
            description="Edit your name, photo, and about"
            onClick={() => navigate("/user-profile")}
          />
          <SettingRow
            icon={FaStar}
            label="Starred messages"
            description="View your starred messages"
            onClick={() => navigate("/settings/starred")}
          />
        </div>

        <div className={cardClass}>
          <SettingRow
            icon={FaPalette}
            label="Theme"
            description={`Current: ${preference || theme}`}
            onClick={() => setShowTheme(!showTheme)}
          />
          {showTheme && (
            <div className="px-4 pb-4 space-y-2">
              {["light", "dark", "system"].map((t) => (
                <label
                  key={t}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-black/5 cursor-pointer capitalize"
                >
                  <input
                    type="radio"
                    name="theme"
                    checked={(preference || theme) === t}
                    onChange={() => setTheme(t)}
                    className="text-red-500"
                  />
                  {t}
                </label>
              ))}
            </div>
          )}
          <SettingRow
            icon={FaBell}
            label="Notifications"
            description={notifications ? "Enabled" : "Disabled"}
            onClick={toggleNotifications}
          />
          <SettingRow
            icon={FaHdd}
            label="Media auto-download"
            description={autoDownload ? "On" : "Off"}
            onClick={toggleAutoDownload}
          />
        </div>

        <div className={cardClass}>
          <SettingRow
            icon={FaShieldAlt}
            label="Privacy Policy"
            onClick={() => navigate("/settings/privacy")}
          />
          <SettingRow
            icon={FaInfoCircle}
            label="About Connect"
            description="Version 1.0.0"
            onClick={() => navigate("/settings/about")}
          />
        </div>

        <div className={cardClass}>
          <SettingRow
            icon={FaSignOutAlt}
            label="Log out"
            onClick={handleLogout}
            danger
          />
        </div>
      </div>
    </AppShell>
  );
};

export default Settings;
