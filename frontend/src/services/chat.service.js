import {io} from "socket.io-client";
import useUserStore from "../store/UseUserStore";
import { ACTIONS } from "../utils/actions";

let socket = null;

export const initializeSocket = () =>  {
    if(socket) return socket;

    const user = useUserStore.getState().user;

    const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;
    socket = io(BACKEND_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'], 
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,

    })

    socket.on("connect", () => {
        console.log("Connected to socket server", socket.id);
        socket.emit(ACTIONS.USER_CONNECTED, { userId: user?.id });
    });

    socket.on(ACTIONS.CONNECT_ERROR, (err) => {
        console.error("Connection error:", err);
    });
    
    socket.on(ACTIONS.DISCONNECT, (reason) => {
        console.log("Disconnected from socket server:", reason);
    });

    return socket;

}

export const getSocket = () => {
    if (!socket) {
        return initializeSocket();
    }
    return socket;
}

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        console.log("Socket disconnected");
    }
}