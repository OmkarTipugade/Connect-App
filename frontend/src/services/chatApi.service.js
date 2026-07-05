import axiosInstance from "./url.service";

export const fetchConversations = () =>
  axiosInstance.get("/api/chat/conversations");

export const fetchMessages = (conversationId) =>
  axiosInstance.get(`/api/chat/get-messages/${conversationId}/messages`);

export const sendMessage = (formData) =>
  axiosInstance.post("/api/chat/send-message", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const markMessagesAsRead = (messageIds) =>
  axiosInstance.put("/api/chat/messages/mark-as-read", { messageIds });

export const deleteMessage = (messageId) =>
  axiosInstance.delete(`/api/chat/delete-message/${messageId}`);

export const starMessage = (messageId) =>
  axiosInstance.post(`/api/chat/messages/${messageId}/star`);

export const unstarMessage = (messageId) =>
  axiosInstance.delete(`/api/chat/messages/${messageId}/star`);

export const fetchStarredMessages = () =>
  axiosInstance.get("/api/chat/starred-messages");
