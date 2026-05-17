import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "../../store/chatStore";
import useUserStore from "../../store/UseUserStore";
import useLayoutStore from "../../store/layoutStore";
import { ACTIONS } from "../../utils/actions";
import { getSocket } from "../../services/chat.service";
import axiosInstance from "../../services/url.service";
import formatTimestamp from "../../utils/formatTime";

const ChatWindow = () => {
  const {
    messages,
    currentConversation,
    currentUser,
    isUserOnline,
    isUserTyping,
    onlineUsers,
    fetchMessages,
    receiveMessage,
    deleteMessege,
    toggleReaction,
    startTyping,
    stopTyping,
    markMessagesAsRead,
  } = useChatStore();

  const { user } = useUserStore();
  const selectedContact = useLayoutStore((state) => state.selectedContact);
  const [messageInput, setMessageInput] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reactions, setReactions] = useState({});
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socket = getSocket();

  // Scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages when contact is selected
  useEffect(() => {
    if (selectedContact?.conversation?.id) {
      fetchMessages(selectedContact.conversation.id);
    }
  }, [selectedContact, fetchMessages]);

  // Setup socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    socket.off(ACTIONS.RECEIVE_MESSAGE);
    socket.on(ACTIONS.RECEIVE_MESSAGE, ({ message, conversationId }) => {
      if (conversationId === currentConversation) {
        receiveMessage(message);
      }
    });

    socket.off(ACTIONS.MESSAGE_DELETED);
    socket.on(ACTIONS.MESSAGE_DELETED, ({ messageId }) => {
      deleteMessege(messageId);
    });

    socket.off(ACTIONS.MESSAGE_READ);
    socket.on(ACTIONS.MESSAGE_READ, ({ messageId, messageStatus }) => {
      // Update message status in local state
    });

    return () => {
      socket.off(ACTIONS.RECEIVE_MESSAGE);
      socket.off(ACTIONS.MESSAGE_DELETED);
      socket.off(ACTIONS.MESSAGE_READ);
    };
  }, [socket, currentConversation, receiveMessage]);

  // Get the other user in conversation (from selected contact)
  const otherUser = selectedContact || null;

  // Handle file selection
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);

      // Create preview for images
      if (selectedFile.type.startsWith("image")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(selectedFile);
      } else if (selectedFile.type.startsWith("video")) {
        setPreview("video");
      }
    }
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!messageInput.trim() && !file) return;
    if (!currentConversation || !user?.id || !otherUser?.id) return;

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

      const { data } = await axiosInstance.post("/chats/send", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (data?.data?.message) {
        receiveMessage(data.data.message);
      }

      setMessageInput("");
      setFile(null);
      setPreview(null);
      stopTyping(otherUser.id);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle typing indicator
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

  // Handle message delete
  const handleDeleteMessage = async (messageId) => {
    try {
      await axiosInstance.delete(`/chats/messages/${messageId}`);
      deleteMessege(messageId);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  // Handle reaction
  const handleReaction = (messageId, emoji) => {
    toggleReaction(messageId, emoji);
    setReactions((prev) => ({
      ...prev,
      [messageId]: emoji,
    }));
  };

  // Get message status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "SENT":
        return "✓";
      case "DELIVERED":
        return "✓✓";
      case "READ":
        return "✓✓";
      default:
        return "";
    }
  };

  // Get online status display
  const getUserStatusDisplay = () => {
    if (!otherUser) return "";
    const isOnline = isUserOnline(otherUser.id);
    if (isOnline === true) {
      return "Online";
    } else if (isOnline === false && onlineUsers.get(otherUser.id)?.lastSeen) {
      return `Last seen ${formatTimestamp(onlineUsers.get(otherUser.id).lastSeen)}`;
    }
    return "Offline";
  };

  if (!selectedContact) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <p className="text-gray-400 text-lg">Select a conversation to start</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={otherUser?.profilePicture || "/default-avatar.png"}
            alt={otherUser?.username}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h2 className="font-semibold text-gray-900">
              {otherUser?.username}
            </h2>
            <p className="text-sm text-gray-500">{getUserStatusDisplay()}</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">
              No messages yet. Start a conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender?.id === user?.id
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                  message.sender?.id === user?.id
                    ? "bg-blue-500 text-white"
                    : "bg-gray-300 text-gray-900"
                }`}
              >
                {/* Message Content */}
                {message.contentType === "TEXT" && (
                  <p className="wrap-break-word">{message.content}</p>
                )}

                {message.contentType === "IMAGE" && message.imageOrVideoUrl && (
                  <img
                    src={message.imageOrVideoUrl}
                    alt="shared"
                    className="max-w-full rounded-lg"
                  />
                )}

                {message.contentType === "VIDEO" && message.imageOrVideoUrl && (
                  <video
                    src={message.imageOrVideoUrl}
                    controls
                    className="max-w-full rounded-lg"
                  />
                )}

                {/* Message Footer */}
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-xs opacity-70">
                    {formatTimestamp(message.createdAt)}
                  </span>

                  {message.sender?.id === user?.id && (
                    <span
                      className={`text-xs ${
                        message.messageStatus === "READ"
                          ? "font-bold"
                          : "opacity-70"
                      }`}
                    >
                      {getStatusIcon(message.messageStatus)}
                    </span>
                  )}
                </div>

                {/* Reactions */}
                {message.reactions && message.reactions.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {message.reactions.map((reaction, idx) => (
                      <span
                        key={idx}
                        className="text-lg bg-white bg-opacity-30 px-2 py-1 rounded cursor-pointer hover:bg-opacity-50"
                        onClick={() =>
                          handleReaction(message.id, reaction.emoji)
                        }
                      >
                        {reaction.emoji}
                      </span>
                    ))}
                  </div>
                )}

                {/* Message Actions */}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleReaction(message.id, "👍")}
                    className="text-xs opacity-50 hover:opacity-100 transition"
                    title="React"
                  >
                    👍
                  </button>
                  {message.sender?.id === user?.id && (
                    <button
                      onClick={() => handleDeleteMessage(message.id)}
                      className="text-xs opacity-50 hover:opacity-100 transition text-red-400"
                      title="Delete"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Typing Indicator */}
        {isUserTyping(otherUser?.id) && (
          <div className="flex justify-start">
            <div className="bg-gray-300 text-gray-900 px-4 py-2 rounded-lg">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></span>
                <span
                  className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></span>
                <span
                  className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* File Preview */}
      {preview && (
        <div className="px-4 py-2 bg-gray-100 border-t border-gray-200 flex items-center gap-2">
          {preview === "video" ? (
            <div className="flex items-center gap-2">
              <span className="text-sm">📹 {file?.name}</span>
              <button
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

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={handleInputChange}
            placeholder="Type a message..."
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <label className="flex items-center cursor-pointer">
            <input
              type="file"
              onChange={handleFileSelect}
              accept="image/*,video/*"
              className="hidden"
            />
            <span className="text-xl hover:text-blue-500 transition">📎</span>
          </label>

          <button
            onClick={handleSendMessage}
            disabled={loading || (!messageInput.trim() && !file)}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
