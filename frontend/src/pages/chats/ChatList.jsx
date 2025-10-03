import { useState } from "react";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/UseUserStore";
import useLayoutStore from "../../store/layoutStore";
import { FaPlus, FaSearch } from "react-icons/fa";
import { motion } from "framer-motion";
import formatTimestamp from "../../utils/formatTime";

const ChatList = ({ contacts }) => {
  const { theme } = useThemeStore();
  const { user } = useUserStore((state) => state.user);
  const setSelectedContact = useLayoutStore(
    (state) => state.setSelectedContact
  );
  const selectedContact = useLayoutStore((state) => state.selectedContact);
  const [searchTerms, setSearchTerms] = useState("");
  const filteredContacts = Array.isArray(contacts)
    ? contacts.filter((contact) =>
        contact?.username?.toLowerCase().includes(searchTerms.toLowerCase())
      )
    : [];
  console.log(filteredContacts);
  return (
    <div
      className={`w-full border-r h-screen ${
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
      <div className="p-2">
        <div className="relative">
          <FaSearch
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
              theme === "dark" ? "to-gray-400" : "text-gray-800"
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
        <div className="overflow-y-auto h-[calc(100vh-120px)] rounded-lg mt-2">
          {filteredContacts.map((contact) => (
            <motion.div
              key={contact?.id}
              onClick={() => {
                setSelectedContact(contact);
              }}
              className={`p-3 flex items-center cursor-pointer ${
                theme === "dark"
                  ? selectedContact?.id === contact?.id
                    ? "bg-gray-700"
                    : " hover:bg-gray-800"
                  : selectedContact?.id === contact?.id
                  ? "bg-gray-200"
                  : "bg-gray-100"
              }`}
            >
              <img
                src={contact?.profilePicture}
                alt={contact?.username}
                className="w-12 h-12 rounded-md bg-red-500"
              />
              <div className="ml-3 flex-1">
                <div className="flex justify-between items-baseline">
                  <h2
                    className={`font-semibold ${
                      theme === "dark" ? "text-gray-50" : "to-gray-900"
                    }`}
                  >
                    {contact?.username}
                  </h2>
                  {contact?.conversation && (
                    <span
                      className={`text-xs ${
                        theme === "dark" ? "text-gray-500" : "text-gray-300"
                      }`}
                    >
                      {formatTimestamp(
                        contact?.conversation?.[contact.conversation.length - 1]
                          ?.lastMsg?.createdAt
                      )}
                    </span>
                  )}
                </div>
                <div>
                  <p
                    className={`text-sm ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    } truncate`}
                  >
                    {contact?.conversation?.lastMsg?.content}
                  </p>
                  {contact?.conversation &&
                    contact?.conversation?.unreadCount > 0 &&
                    contact?.conversation?.lastMsg?.receiver?.id ===
                      user?.id && (
                      <p
                        className={`text-sm font-semibold w-6 h-6 flex justify-center items-center bg-yellow-500 rounded-lg ${
                          theme === "dark" ? "text-gray-800" : "text-gray-500"
                        } truncate`}
                      >
                        {contact?.conversation?.unreadCount}
                      </p>
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
