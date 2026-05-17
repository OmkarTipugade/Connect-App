import { create } from "zustand";
import { getSocket } from "../services/chat.service";
import { ACTIONS } from "../utils/actions";
import axiosInstance from "../services/url.service";
import { m } from "framer-motion";

export const useChatStore = create((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  error: null,
  onlineUsers: new Map(),
  typingUsers: new Map(),

  initSocketListeners: () => {
    const socket = getSocket();
    if (!socket) return;

    // remove existing listeners to prevent duplicates
    socket.off(ACTIONS.RECEIVE_MESSAGE);
    socket.off(ACTIONS.USER_TYPING);
    socket.off(ACTIONS.SEND_MESSAGE);
    socket.off(ACTIONS.SEND_MESSAGE_ERROR);
    socket.off(ACTIONS.MESSAGE_DELETED);

    //listen for incoming messages
    socket.on(ACTIONS.RECEIVE_MESSAGE, (message) => {});

    //confirmation of sent message
    socket.on(ACTIONS.SEND_MESSAGE, (message) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === message.id ? { ...msg } : msg,
        ),
      }));
    });

    socket.on(ACTIONS.MESSAGE_STATUS_UPDATED, ({ messageId, status }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === messageId ? { ...msg, status } : msg,
        ),
      }));
    });

    socket.on(ACTIONS.REACTION_UPDATE, ({ messageId, reactions }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === messageId ? { ...msg, reactions } : msg,
        ),
      }));
    });

    //handle send message error
    socket.on(ACTIONS.SEND_MESSAGE_ERROR, (error) => {
      console.error("Error sending message:", error);
    });

    //handle message deletion
    socket.on(ACTIONS.MESSAGE_DELETED, ({ messageId }) => {
      set((state) => ({
        messages: state.messages.filter((msg) => msg.id !== messageId),
      }));
    });

    socket.on(ACTIONS.USER_TYPING, ({ conversationId, userId, isTyping }) => {
      set((state) => {
        const typingUsers = new Map(state.typingUsers);
        if (!typingUsers.has(conversationId)) {
          typingUsers.set(conversationId, new Set());
        }
        const typingSet = typingUsers.get(conversationId);
        if (isTyping) {
          typingSet.add(userId);
        } else {
          typingSet.delete(userId);
          if (typingSet.size === 0) {
            typingUsers.delete(conversationId);
          }
        }
        return { typingUsers };
      });
    });

    socket.on(ACTIONS.TYPING_STOP, ({ conversationId, userId }) => {
      set((state) => {
        const typingUsers = new Map(state.typingUsers);
        if (typingUsers.has(conversationId)) {
          typingUsers.get(conversationId).delete(userId);
          if (typingUsers.get(conversationId).size === 0) {
            typingUsers.delete(conversationId);
          }
        }
        return { typingUsers };
      });
    });

    socket.on(ACTIONS.USER_STATUS, ({ userId, isOnline, lastSeen }) => {
      set((state) => {
        const onlineUsers = new Map(state.onlineUsers);
        onlineUsers.set(userId, { isOnline, lastSeen });
        return { onlineUsers };
      });
    });

    //emit status update request for all users in current conversation list
    const { conversations } = get();
    if (conversations?.data?.length > 0) {
      conversations.data.forEach((conv) => {
        const otherUser = conv.participants.find(
          (p) => p.id !== get().currentUser?.id,
        );
        if (otherUser.id) {
          socket.emit(ACTIONS.GET_USER_STATUS, otherUser.id, (status) => {
            set((state) => {
              const onlineUsers = new Map(state.onlineUsers);
              onlineUsers.set(state.userId, {
                isOnline: state.isOnline,
                lastSeen: state.lastSeen,
              });
              return { onlineUsers };
            });
          });
        }
      });
    }
  },

  setCurrentUser: (user) => set({ currentUser: user }),

  fetchConversations: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosInstance.get("/chats/conversations");
      set({ conversations: data, loading: false });

      get().initSocketListeners();
      return data;
    } catch (error) {
      set({
        error:
          error?.response?.data?.message || "Failed to fetch conversations",
        loading: false,
      });
      throw error;
      return null;
    }
  },

  // fetch messages for a conversation
  fetchMessages: async (conversationId) => {
    if (!conversationId) return;
    set({ loading: true, error: null });
    try {
      const { data } = await axiosInstance.get(
        `/chats/conversations/${conversationId}/messages`,
      );
      const messagesArr = data?.data || data || [];
      set({
        messages: messagesArr,
        currentConversation: conversationId,
        loading: false,
      });

      //mark unread messages as read when fetched
      const {markMessagesAsRead} = get();
        markMessagesAsRead();
      return messagesArr;
    } catch (error) {
      set({
        error: error?.response?.data?.message || "Failed to fetch messages",
        loading: false,
      });
      throw error;
      return [];
    }
  },

  sendMessage: async (formData) => {},

  receiveMessage: (message) => {
    if (!message) return;

    const { currentConversation, currentUser, messages } = get();

    const messageExists = messages.some((msg) => msg.id === message.id);
    if (messageExists) return;

    if (message.conversationId === currentConversation) {
      set((state) => ({ messages: [...state.messages, message] }));

      if(message.receiver?.id === currentUser?.id) {
        get().markMessagesAsRead();
      }
    }
    set((state) => {
      const updatedConversations = state.conversations?.data?.map((conv) => {
        if (conv.id === message.conversationId) {
          return {
            ...conv,
            lastMessage: message,
            unreadCount:
              message.receiver?.id === currentUser?.id
                ? (conv.unreadCount || 0) + 1
                : conv.unreadCount,
          };
        }
        return conv;
      });
      return {
        conversations: { ...state.conversations, data: updatedConversations },
      };
    });
  },

  markMessagesAsRead: async () => {
    const { messages, currentUser } = get();

    if (messages.length === 0) return;
    if (!currentUser) return;

    const unreadMessagesIds = messages
      .filter(
        (msg) => msg.status !== "read" && msg.receiver?.id === currentUser?.id,
      )
      .map((msg) => msg.id)
      .filter(Boolean);

    if (unreadMessagesIds.length === 0) return;
    try {
      const { data } = await axiosInstance.put(`/chats/messages/read`, {
        messageIds: unreadMessagesIds,
      });
      console.log("Messages marked as read:", data);
      set((state) => ({
        messages: state.messages.map((msg) =>
          unreadMessagesIds.includes(msg.id) ? { ...msg, status: "read" } : msg,
        ),
      }));

      const socket = getSocket();
      if (socket) {
        socket.emit(ACTIONS.MESSAGE_READ, {
          messageIds: unreadMessagesIds,
          senderId: messages[0].sender?.id,
        });
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  },

  deleteMessege: async (messageId) => {
    try {
      axiosInstance.delete(`/chats/messages/${messageId}`);

      set((state) => ({
        messages: state.messages?.filter((msg) => msg.id !== messageId),
      }));
      return true;
    } catch (error) {
      console.error("Error deleting message:", error);
      set({
        error: error?.response?.data?.message || "Failed to delete message",
      });
    }
  },

  // add/update reaction
  toggleReaction: async (messageId, reaction) => {
    const socket = getSocket();
    const { currentUser } = get();

    if (socket && currentUser) {
      socket.emit(ACTIONS.ADD_REACTION, {
        messageId,
        reaction,
        senderId: currentUser.id,
      });
    }
  },

  startTyping: (receiverId) => {
    const socket = getSocket();
    const { currentConversation } = get();

    if (socket && currentConversation && receiverId) {
      socket.emit(ACTIONS.TYPING_START, {
        conversationId: currentConversation,
        receiverId,
      });
    }
  },

  stopTyping: (receiverId) => {
    const socket = getSocket();
    const { currentConversation } = get();

    if (socket && currentConversation && receiverId) {
      socket.emit(ACTIONS.TYPING_STOP, {
        conversationId: currentConversation,
        receiverId,
      });
    }
  },

  isUserTyping: (userId) => {
    const { typingUsers, currentConversation } = get();

    if (
      !currentConversation ||
      !typingUsers.has(currentConversation) ||
      !userId
    )
      return false;

    return typingUsers.get(currentConversation).has(userId);
  },

  isUserOnline: (userId) => {
    if (!userId) return null;
    const { onlineUsers } = get();
    if (!onlineUsers.has(userId)) return null;

    return onlineUsers.get(userId)?.isOnline;
  },

  getUserLastSeen: (userId) => {
    if (!userId) return null;
    const { onlineUsers } = get();
    if (!onlineUsers.has(userId)) return null;
    return onlineUsers.get(userId)?.lastSeen;
  },

  cleanup: () => set({
    conversations: [],
    currentConversation: null,
    messages: [],
    loading: false,
    error: null,
    onlineUsers: new Map(),
    typingUsers: new Map(),}),
}));
