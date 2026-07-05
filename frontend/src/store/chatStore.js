import { create } from "zustand";
import { getSocket } from "../services/chat.service";
import {
  deleteMessage as deleteMessageApi,
  fetchConversations as fetchConversationsApi,
  fetchMessages as fetchMessagesApi,
  markMessagesAsRead as markMessagesAsReadApi,
  sendMessage as sendMessageApi,
} from "../services/chatApi.service";
import { ACTIONS } from "../utils/actions";

let listenersInitialized = false;

export const useChatStore = create((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  currentUser: null,
  loading: false,
  error: null,
  onlineUsers: new Map(),
  typingUsers: new Map(),

  setCurrentUser: (user) => set({ currentUser: user }),

  setCurrentConversation: (conversationId) =>
    set({ currentConversation: conversationId }),

  initSocketListeners: () => {
    const socket = getSocket();
    if (!socket || listenersInitialized) return;

    listenersInitialized = true;

    socket.off(ACTIONS.RECEIVE_MESSAGE);
    socket.off(ACTIONS.USER_TYPING);
    socket.off(ACTIONS.MESSAGE_STATUS_UPDATED);
    socket.off(ACTIONS.REACTION_UPDATE);
    socket.off(ACTIONS.MESSAGE_DELETED);
    socket.off(ACTIONS.USER_STATUS_UPDATE);
    socket.off(ACTIONS.MESSAGE_EDITED);

    socket.on(ACTIONS.RECEIVE_MESSAGE, (payload) => {
      const message = payload?.message ?? payload;
      get().receiveMessage(message);
    });

    socket.on(ACTIONS.MESSAGE_STATUS_UPDATED, ({ messageId, status, messageStatus }) => {
      const nextStatus = messageStatus || status;
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === messageId ? { ...msg, messageStatus: nextStatus } : msg,
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

    socket.on(ACTIONS.MESSAGE_DELETED, ({ messageId }) => {
      set((state) => ({
        messages: state.messages.filter((msg) => msg.id !== messageId),
      }));
    });

    socket.on(ACTIONS.MESSAGE_EDITED, ({ message }) => {
      if (!message?.id) return;
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === message.id ? { ...msg, ...message } : msg,
        ),
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

    socket.on(ACTIONS.USER_STATUS_UPDATE, ({ userId, isOnline, lastSeen }) => {
      set((state) => {
        const onlineUsers = new Map(state.onlineUsers);
        const existing = onlineUsers.get(userId) || {};
        onlineUsers.set(userId, {
          isOnline,
          lastSeen: lastSeen ?? (isOnline ? null : existing.lastSeen),
        });
        return { onlineUsers };
      });
    });
  },

  requestUserStatus: (userId) => {
    const socket = getSocket();
    if (!socket || !userId) return;

    socket.emit(ACTIONS.GET_USER_STATUS, userId, (status) => {
      if (!status?.userId) return;
      set((state) => {
        const onlineUsers = new Map(state.onlineUsers);
        onlineUsers.set(status.userId, {
          isOnline: status.isOnline,
          lastSeen: status.lastSeen,
        });
        return { onlineUsers };
      });
    });
  },

  fetchConversations: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await fetchConversationsApi();
      const conversations = data?.data?.conversations ?? data?.conversations ?? [];
      set({ conversations, loading: false });
      get().initSocketListeners();
      return conversations;
    } catch (error) {
      set({
        error:
          error?.response?.data?.message || "Failed to fetch conversations",
        loading: false,
      });
      throw error;
    }
  },

  fetchMessages: async (conversationId) => {
    if (!conversationId) return;
    set({ loading: true, error: null, currentConversation: conversationId });
    try {
      const { data } = await fetchMessagesApi(conversationId);
      const messagesArr = data?.data?.messages ?? [];
      set({ messages: messagesArr, loading: false });
      get().markMessagesAsRead();
      return messagesArr;
    } catch (error) {
      set({
        error: error?.response?.data?.message || "Failed to fetch messages",
        loading: false,
      });
      throw error;
    }
  },

  clearMessages: () => set({ messages: [], currentConversation: null }),

  sendMessage: async (formData) => {
    const { data } = await sendMessageApi(formData);
    const message = data?.data?.message;
    if (message) {
      if (!get().currentConversation && message.conversationId) {
        set({ currentConversation: message.conversationId });
      }
      get().receiveMessage(message);
    }
    return message;
  },

  receiveMessage: (message) => {
    if (!message) return;

    const { currentConversation, currentUser, messages } = get();
    const messageExists = messages.some((msg) => msg.id === message.id);
    if (messageExists) return;

    if (message.conversationId === currentConversation) {
      set((state) => ({ messages: [...state.messages, message] }));

      if (message.receiverId === currentUser?.id || message.receiver?.id === currentUser?.id) {
        get().markMessagesAsRead();
      }
    }
  },

  markMessagesAsRead: async () => {
    const { messages, currentUser } = get();
    if (messages.length === 0 || !currentUser) return;

    const unreadMessageIds = messages
      .filter(
        (msg) =>
          msg.messageStatus !== "READ" &&
          (msg.receiverId === currentUser.id || msg.receiver?.id === currentUser.id),
      )
      .map((msg) => msg.id)
      .filter(Boolean);

    if (unreadMessageIds.length === 0) return;

    try {
      await markMessagesAsReadApi(unreadMessageIds);

      set((state) => ({
        messages: state.messages.map((msg) =>
          unreadMessageIds.includes(msg.id)
            ? { ...msg, messageStatus: "READ" }
            : msg,
        ),
      }));

      const socket = getSocket();
      const senderId = messages.find((msg) => unreadMessageIds.includes(msg.id))
        ?.senderId;

      if (socket && senderId) {
        socket.emit(ACTIONS.MESSAGE_READ, {
          messageIds: unreadMessageIds,
          senderId,
        });
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await deleteMessageApi(messageId);
      set((state) => ({
        messages: state.messages.filter((msg) => msg.id !== messageId),
      }));
      return true;
    } catch (error) {
      console.error("Error deleting message:", error);
      set({
        error: error?.response?.data?.message || "Failed to delete message",
      });
      return false;
    }
  },

  toggleReaction: (messageId, emoji) => {
    const socket = getSocket();
    const { currentUser } = get();

    if (socket && currentUser) {
      socket.emit(ACTIONS.ADD_REACTION, {
        messageId,
        emoji,
        userId: currentUser.id,
        reactionUserId: currentUser.id,
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
    if (!currentConversation || !typingUsers.has(currentConversation) || !userId) {
      return false;
    }
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

  cleanup: () => {
    listenersInitialized = false;
    const socket = getSocket();
    if (socket) {
      socket.off(ACTIONS.RECEIVE_MESSAGE);
      socket.off(ACTIONS.USER_TYPING);
      socket.off(ACTIONS.MESSAGE_STATUS_UPDATED);
      socket.off(ACTIONS.REACTION_UPDATE);
      socket.off(ACTIONS.MESSAGE_DELETED);
      socket.off(ACTIONS.USER_STATUS_UPDATE);
    }
    set({
      conversations: [],
      currentConversation: null,
      messages: [],
      loading: false,
      error: null,
      onlineUsers: new Map(),
      typingUsers: new Map(),
    });
  },
}));
