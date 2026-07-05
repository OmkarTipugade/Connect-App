import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { getAllUsers } from "../../services/user.service";
import useThemeStore from "../../store/themeStore";

const ForwardMessageModal = ({ message, open, onClose, onForward }) => {
  const { theme } = useThemeStore();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const isDark = theme === "dark";

  useEffect(() => {
    if (!open) return;
    getAllUsers()
      .then((res) => setContacts(res?.data?.users ?? []))
      .catch(() => setContacts([]));
  }, [open]);

  if (!open || !message) return null;

  const handleForward = async (contact) => {
    setLoading(true);
    try {
      await onForward(contact, message);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`w-full sm:max-w-md max-h-[70vh] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col ${
          isDark ? "bg-[#202c33] text-white" : "bg-white"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700/30">
          <h2 className="font-semibold">Forward message</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-black/10">
            <FaTimes />
          </button>
        </div>
        <div className="overflow-y-auto p-2">
          {contacts.map((contact) => (
            <button
              key={contact.id}
              type="button"
              disabled={loading}
              onClick={() => handleForward(contact)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition"
            >
              <img
                src={contact.profilePicture || "/default-avatar.png"}
                alt=""
                className="w-10 h-10 rounded-full object-cover"
              />
              <span className="font-medium">{contact.username}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ForwardMessageModal;
