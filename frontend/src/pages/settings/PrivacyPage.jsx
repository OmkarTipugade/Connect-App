import AppShell from "../../components/AppShell";
import useThemeStore from "../../store/themeStore";

const PrivacyPage = () => {
  const { theme } = useThemeStore();
  const card =
    theme === "dark" ? "bg-[#202c33] rounded-2xl p-6" : "bg-white rounded-2xl p-6 shadow-sm";

  return (
    <AppShell title="Privacy Policy">
      <div className="max-w-lg mx-auto p-4">
        <div className={`${card} space-y-4 text-sm opacity-80 leading-relaxed`}>
          <p>
            Your messages are stored securely on our servers. We use JWT-based
            authentication and encrypted connections for all API and WebSocket
            communication.
          </p>
          <p>
            Profile information (name, photo, about) is visible to other users
            you interact with. Status updates expire automatically after 24 hours.
          </p>
          <p>
            We do not sell your personal data. For questions, contact support.
          </p>
        </div>
      </div>
    </AppShell>
  );
};

export default PrivacyPage;
