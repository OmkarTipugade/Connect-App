import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaTimes, FaImages, FaChevronDown } from "react-icons/fa";
import { toast } from "react-toastify";
import { useChatStore } from "../../store/chatStore";
import useUserStore from "../../store/UseUserStore";
import useLayoutStore from "../../store/layoutStore";
import MessageBubble from "../../components/chat/MessageBubble";
import DateSeparator, { formatDateLabel } from "../../components/chat/DateSeparator";
import ForwardMessageModal from "../../components/chat/ForwardMessageModal";
import MediaGalleryModal from "../../components/chat/MediaGalleryModal";
import {
  starMessage,
  unstarMessage,
  editMessage as editMessageApi,
  pinMessage as pinMessageApi,
} from "../../services/chatApi.service";
import formatTimestamp from "../../utils/formatTime";

const ChatWindow = ({ isMobile, setSelectedContact }) => {
  const {
    messages,
    isUserOnline,
    isUserTyping,
    onlineUsers,
    fetchMessages,
    clearMessages,
    sendMessage,
    deleteMessage,
    toggleReaction,
    startTyping,
    stopTyping,
    requestUserStatus,
    setCurrentConversation,
  } = useChatStore();

  const user = useUserStore((state) => state.user);
  const selectedContact = useLayoutStore((state) => state.selectedContact);
  const navigate = useNavigate();
  const [messageInput, setMessageInput] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [starredIds, setStarredIds] = useState(new Set());
  const [forwardMessage, setForwardMessage] = useState(null);
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollDown(distanceFromBottom > 200);
  };

  const pinnedMessage = useMemo(
    () => messages.find((m) => m.isPinned),
    [messages],
  );

  useEffect(() => {
    if (selectedContact?.conversation?.id) {
      fetchMessages(selectedContact.conversation.id);
    } else if (selectedContact) {
      clearMessages();
    }
  }, [selectedContact?.id, selectedContact?.conversation?.id, fetchMessages, clearMessages]);

  useEffect(() => {
    if (selectedContact?.id) {
      requestUserStatus(selectedContact.id);
    }
  }, [selectedContact?.id, requestUserStatus]);

  const otherUser = selectedContact || null;

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith("image")) {
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(selectedFile);
      } else if (selectedFile.type.startsWith("video")) {
        setPreview("video");
      }
    }
  };

  const handleStar = async (messageId) => {
    try {
      if (starredIds.has(messageId)) {
        await unstarMessage(messageId);
        setStarredIds((prev) => {
          const next = new Set(prev);
          next.delete(messageId);
          return next;
        });
        toast.success("Unstarred");
      } else {
        await starMessage(messageId);
        setStarredIds((prev) => new Set(prev).add(messageId));
        toast.success("Message starred");
      }
    } catch {
      toast.error("Failed to update star");
    }
  };

  const handleForward = async (contact, message) => {
    const formData = new FormData();
    formData.append("senderId", user.id);
    formData.append("receiverId", contact.id);
    const label = message.contentType === "TEXT"
      ? message.content
      : `[${message.contentType}]`;
    formData.append("content", `↪ Forwarded: ${label}`);
    formData.append("messageStatus", "SENT");
    await sendMessage(formData);
    toast.success(`Forwarded to ${contact.username}`);
  };

  const handleEdit = (message) => {
    setEditingMessage(message);
    setMessageInput(message.content || "");
  };

  const handlePin = async (message) => {
    try {
      const pinned = !message.isPinned;
      await pinMessageApi(message.id, pinned);
      useChatStore.setState((state) => ({
        messages: state.messages.map((m) => ({
          ...m,
          isPinned: m.id === message.id ? pinned : pinned ? false : m.isPinned,
        })),
      }));
      toast.success(pinned ? "Message pinned" : "Message unpinned");
    } catch {
      toast.error("Failed to pin message");
    }
  };

  const handleSendMessage = async () => {
    if (editingMessage) {
      if (!messageInput.trim()) return;
      setLoading(true);
      try {
        const { data } = await editMessageApi(editingMessage.id, messageInput.trim());
        const updated = data?.data?.message;
        if (updated) {
          useChatStore.setState((state) => ({
            messages: state.messages.map((m) =>
              m.id === updated.id ? { ...m, ...updated } : m,
            ),
          }));
        }
        setEditingMessage(null);
        setMessageInput("");
        toast.success("Message edited");
      } catch {
        toast.error("Failed to edit message");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!messageInput.trim() && !file) return;
    if (!user?.id || !otherUser?.id) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("senderId", user.id);
      formData.append("receiverId", otherUser.id);
      formData.append("content", messageInput);
      formData.append("messageStatus", "SENT");

      if (file) {
        formData.append("file", file);
      }
      if (replyingTo?.id) {
        formData.append("replyToId", replyingTo.id);
      }

      const message = await sendMessage(formData);

      if (message?.conversationId && !otherUser.conversation?.id) {
        setSelectedContact?.({
          ...otherUser,
          conversation: {
            id: message.conversationId,
            lastMessage: message,
            unreadCount: 0,
          },
        });
        setCurrentConversation(message.conversationId);
      }

      setMessageInput("");
      setFile(null);
      setPreview(null);
      setReplyingTo(null);
      stopTyping(otherUser.id);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);

    if (!typingTimeoutRef.current) {
      startTyping(otherUser?.id);
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(otherUser?.id);
      typingTimeoutRef.current = null;
    }, 1000);
  };

  const handleDeleteMessage = async (messageId) => {
    await deleteMessage(messageId);
  };

  const handleReaction = (messageId, emoji) => {
    toggleReaction(messageId, emoji);
  };

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter((m) => m.content?.toLowerCase().includes(q));
  }, [messages, searchQuery]);

  const messagesWithDates = useMemo(() => {
    const items = [];
    let lastDate = null;
    for (const msg of filteredMessages) {
      const dateLabel = formatDateLabel(msg.createdAt);
      if (dateLabel !== lastDate) {
        items.push({ type: "date", label: dateLabel, key: `date-${dateLabel}-${msg.id}` });
        lastDate = dateLabel;
      }
      items.push({ type: "message", data: msg, key: msg.id });
    }
    return items;
  }, [filteredMessages]);

  const getUserStatusDisplay = () => {
    if (!otherUser) return "";
    const isOnline = isUserOnline(otherUser.id);
    if (isOnline === true) return "Online";
    const lastSeen = onlineUsers.get(otherUser.id)?.lastSeen;
    if (isOnline === false && lastSeen) {
      return `Last seen ${formatTimestamp(lastSeen)}`;
    }
    return "Offline";
  };

  if (!selectedContact) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-[#0b141a]">
        <p className="text-gray-400 text-lg">Select a conversation to start</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0b141a]">
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
        {isMobile && (
          <button
            type="button"
            onClick={() => setSelectedContact?.(null)}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900"
            aria-label="Back to chats"
          >
            ←
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate(`/user/${otherUser.id}`)}
          className="flex items-center gap-3 hover:opacity-80 transition"
        >
          <img
            src={otherUser?.profilePicture || "/default-avatar.png"}
            alt={otherUser?.username}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="text-left">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {otherUser?.username}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {getUserStatusDisplay()}
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setShowMediaGallery(true)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          aria-label="Media gallery"
        >
          <FaImages className="w-4 h-4 text-gray-500" />
        </button>
        <button
          type="button"
          onClick={() => setShowSearch(!showSearch)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          aria-label="Search messages"
        >
          <FaSearch className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {pinnedMessage && (
        <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/30 flex items-center gap-2 text-sm">
          <span className="text-yellow-500">📌</span>
          <p className="truncate flex-1 opacity-80">
            {pinnedMessage.content || `[${pinnedMessage.contentType}]`}
          </p>
        </div>
      )}

      {showSearch && (
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#202c33]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in chat..."
            className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            autoFocus
          />
        </div>
      )}

      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50 dark:bg-[#111b21] relative"
      >
        {filteredMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">
              {searchQuery ? "No matching messages" : "No messages yet. Start a conversation!"}
            </p>
          </div>
        ) : (
          messagesWithDates.map((item) =>
            item.type === "date" ? (
              <DateSeparator key={item.key} label={item.label} />
            ) : (
              <MessageBubble
                key={item.key}
                message={item.data}
                isOwn={item.data.sender?.id === user?.id || item.data.senderId === user?.id}
                onReaction={handleReaction}
                onDelete={handleDeleteMessage}
                onReply={setReplyingTo}
                onStar={handleStar}
                onForward={setForwardMessage}
                onEdit={handleEdit}
                onPin={handlePin}
                isStarred={starredIds.has(item.data.id)}
              />
            ),
          )
        )}

        {isUserTyping(otherUser?.id) && (
          <div className="flex justify-start">
            <div className="bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <span
                  className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />

        {showScrollDown && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="fixed bottom-24 right-8 p-3 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition z-10"
            aria-label="Jump to latest"
          >
            <FaChevronDown />
          </button>
        )}
      </div>

      {editingMessage && (
        <div className="px-4 py-2 bg-blue-500/10 border-t border-blue-500/30 flex items-center justify-between text-sm">
          <p className="text-blue-500 font-medium">Editing message</p>
          <button type="button" onClick={() => { setEditingMessage(null); setMessageInput(""); }} className="p-1 opacity-60 hover:opacity-100">
            <FaTimes />
          </button>
        </div>
      )}

      {replyingTo && (
        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-sm border-l-2 border-red-500 pl-3">
            <p className="text-red-500 font-medium">Replying to {replyingTo.sender?.username}</p>
            <p className="opacity-70 truncate max-w-xs">{replyingTo.content}</p>
          </div>
          <button type="button" onClick={() => setReplyingTo(null)} className="p-1 opacity-60 hover:opacity-100">
            <FaTimes />
          </button>
        </div>
      )}

      {preview && (
        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
          {preview === "video" ? (
            <div className="flex items-center gap-2">
              <span className="text-sm">📹 {file?.name}</span>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <img src={preview} alt="preview" className="h-12 rounded" />
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-[#202c33]">
        <div className="flex gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={handleInputChange}
            placeholder={editingMessage ? "Edit message..." : "Type a message..."}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-white"
          />

          <label className="flex items-center cursor-pointer">
            <input
              type="file"
              onChange={handleFileSelect}
              accept="image/*,video/*"
              className="hidden"
            />
            <span className="text-xl hover:text-red-500 transition">📎</span>
          </label>

          <button
            type="button"
            onClick={handleSendMessage}
            disabled={loading || (!messageInput.trim() && !file)}
            className="bg-red-500 text-white px-6 py-2 rounded-full hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? "..." : editingMessage ? "Save" : "Send"}
          </button>
        </div>
      </div>

      <ForwardMessageModal
        message={forwardMessage}
        open={Boolean(forwardMessage)}
        onClose={() => setForwardMessage(null)}
        onForward={handleForward}
      />
      <MediaGalleryModal
        messages={messages}
        open={showMediaGallery}
        onClose={() => setShowMediaGallery(false)}
      />
    </div>
  );
};

export default ChatWindow;
