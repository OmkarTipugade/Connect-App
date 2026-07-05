import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaStar } from "react-icons/fa";
import AppShell from "../../components/AppShell";
import useThemeStore from "../../store/themeStore";
import { fetchStarredMessages } from "../../services/chatApi.service";
import formatTimestamp from "../../utils/formatTime";

const StarredMessagesPage = () => {
  const { theme } = useThemeStore();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStarredMessages()
      .then(({ data }) => {
        setMessages(data?.data?.messages ?? []);
      })
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, []);

  const card =
    theme === "dark" ? "bg-[#202c33] rounded-xl p-4" : "bg-white rounded-xl p-4 shadow-sm";

  return (
    <AppShell title="Starred messages">
      <div className="max-w-lg mx-auto p-4">
        <Link
          to="/settings"
          className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 mb-4"
        >
          <FaArrowLeft className="w-3 h-3" /> Settings
        </Link>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-16 rounded-xl ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className={`text-center py-12 ${card}`}>
            <FaStar className="w-8 h-8 mx-auto mb-3 text-yellow-500 opacity-50" />
            <p className="font-medium">No starred messages</p>
            <p className="text-sm opacity-60 mt-1">
              Star messages from chat to find them here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => (
              <div key={msg.id} className={card}>
                <p className="text-xs opacity-50 mb-1">
                  {msg.sender?.username} · {formatTimestamp(msg.createdAt)}
                </p>
                <p className="text-sm">{msg.content || `[${msg.contentType}]`}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default StarredMessagesPage;
