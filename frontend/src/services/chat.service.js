import { io } from "socket.io-client";
import useUserStore from "../store/UseUserStore";
import { ACTIONS } from "../utils/actions";
import { API_BASE_URL } from "./url.service";

let socket = null;
let onConnectHandler = null;

const getSocketUrl = () => API_BASE_URL || window.location.origin;

export const setSocketConnectHandler = (handler) => {
  onConnectHandler = handler;
};

export const initializeSocket = () => {
  if (socket?.connected) return socket;

  if (socket) {
    socket.connect();
    return socket;
  }

  socket = io(getSocketUrl(), {
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    const user = useUserStore.getState().user;
    if (user?.id) {
      socket.emit(ACTIONS.USER_CONNECTED, user.id);
    }
    onConnectHandler?.();
  });

  socket.on(ACTIONS.CONNECT_ERROR, (err) => {
    console.error("Connection error:", err);
  });

  socket.on(ACTIONS.DISCONNECT, (reason) => {
    console.log("Disconnected from socket server:", reason);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
