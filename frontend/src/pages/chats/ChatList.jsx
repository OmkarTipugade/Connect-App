import { useState } from "react";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/UseUserStore";
import useLayoutStore from "../../store/layoutStore";
import { useChatStore } from "../../store/chatStore";
import { FaPlus, FaSearch } from "react-icons/fa";
import { motion } from "framer-motion";
import formatTimestamp from "../../utils/formatTime";

const ChatList = () => {
  const { theme } = useThemeStore();
  const user = useUserStore((state) => state.user);
  const contacts = useChatStore((state) => state.contacts);
  const setSelectedContact = useLayoutStore(
    (state) => state.setSelectedContact,
  );
  const selectedContact = useLayoutStore((state) => state.selectedContact);
  const setCurrentConversation = useChatStore(
    (state) => state.setCurrentConversation,
  );
  const clearMessages = useChatStore((state) => state.clearMessages);

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    if (contact?.conversation?.id) {
      setCurrentConversation(contact.conversation.id);
    } else {
      clearMessages();
    }
  };
  const [searchTerms, setSearchTerms] = useState("");
  const filteredContacts = Array.isArray(contacts)
    ? contacts.filter((contact) =>
        contact?.username?.toLowerCase().includes(searchTerms.toLowerCase()),
      )
    : [];
  return (
    <div
      className={`w-full h-full flex flex-col border-r ${
        theme === "dark"
          ? "bg-[rgb(17,27,33)] border-gray-600"
          : "border-gray-200 bg-white"
      }`}
    >
      <div
        className={`p-4 flex justify-between ${
          theme === "dark" ? "text-white" : "text-gray-800"
        }`}
      >
        <h2 className="text-xl font-semibold">Chats</h2>
        <button className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
          {" "}
          <FaPlus />
        </button>
      </div>
      <div className="p-2 flex flex-col flex-1 min-h-0">
        <div className="relative">
          <FaSearch
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
              theme === "dark" ? "text-gray-400" : "text-gray-800"
            }`}
          />
          <input
            type="text"
            className={`w-full pl-10 pr-4 py-2 border rounded-full focus:ring-2 focus:ring-red-500 ${
              theme === "dark"
                ? "bg-gray-800 text-white border-gray-700 placeholder-gray-500"
                : "bg-gray-100 text-black border-gray-200 placeholder-gray-400"
            }`}
            placeholder="Search or start new chat"
            value={searchTerms}
            onChange={(e) => setSearchTerms(e.target.value)}
          />
        </div>
        <div className="overflow-y-auto flex-1 mt-3 pr-1">
          {filteredContacts.map((contact) => (
            <motion.div
              key={contact?.id}
              onClick={() => handleSelectContact(contact)}
              whileHover={{ scale: 1.01 }}
              className={`mx-2 mb-2 p-3 rounded-2xl flex items-center gap-3 cursor-pointer transition-all duration-200
    ${
      theme === "dark"
        ? selectedContact?.id === contact?.id
          ? "bg-gray-700"
          : "hover:bg-gray-800"
        : selectedContact?.id === contact?.id
          ? "bg-gray-200"
          : "hover:bg-gray-100"
    }
  `}
            >
              {/* Profile Image */}
              <img
                src={contact?.profilePicture}
                alt={contact?.username}
                className="w-14 h-14 rounded-full object-cover border border-gray-300"
              />

              {/* Right Content */}
              <div className="flex-1 min-w-0">
                {/* Top Row */}
                <div className="flex items-center justify-between">
                  <h2
                    className={`font-semibold truncate text-[15px] ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {contact?.username}
                  </h2>

                  {contact?.conversation?.lastMessage?.createdAt && (
                    <span
                      className={`text-xs whitespace-nowrap ml-2 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {formatTimestamp(
                        contact?.conversation?.lastMessage?.createdAt,
                      )}
                    </span>
                  )}
                </div>

                {/* Bottom Row */}
                <div className="flex items-center justify-between mt-1 gap-2">
                  <p
                    className={`text-sm truncate ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {contact?.conversation?.lastMessage?.content ||
                      "No messages yet"}
                  </p>

                  {contact?.conversation?.unreadCount > 0 &&
                    contact?.conversation?.lastMessage?.receiver?.id ===
                      user?.id && (
                      <div className="min-w-5.5 h-5.5 px-1 rounded-full bg-yellow-500 flex items-center justify-center text-xs font-semibold text-black">
                        {contact?.conversation?.unreadCount}
                      </div>
                    )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatList;
