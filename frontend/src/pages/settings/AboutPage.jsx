import AppShell from "../../components/AppShell";
import useThemeStore from "../../store/themeStore";

const AboutPage = () => {
  const { theme } = useThemeStore();
  const card =
    theme === "dark" ? "bg-[#202c33] rounded-2xl p-6" : "bg-white rounded-2xl p-6 shadow-sm";

  return (
    <AppShell title="About">
      <div className="max-w-lg mx-auto p-4">
        <div className={card}>
          <h2 className="text-xl font-semibold mb-2">Connect</h2>
          <p className="text-sm opacity-70 leading-relaxed">
            Connect is a modern messaging application with real-time chat, status
            updates, and a clean WhatsApp-inspired experience. Built with React,
            Node.js, and Socket.io.
          </p>
          <p className="text-xs opacity-50 mt-4">Version 1.0.0</p>
        </div>
      </div>
    </AppShell>
  );
};

export default AboutPage;
