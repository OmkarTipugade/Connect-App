const { Server } = require("socket.io");
const { actions } = require("../utils/actions");
const prisma = require("../prismaClient");

require("@dotenvx/dotenvx").config();
// Map to store online users -> userId and their socket IDs
const onlineUsers = new Map();

//Map to track which user is typing to whom
const typingUsers = new Map();

const initializeSocket = (server) => {
  const io = new Server(server, { 
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    },
    pingTimeout: 60000, // 60 seconds disconnect inactive users or sockets
  });

  // When new  socket connection is established
  io.on(actions.CONNECTION, (socket) => {
    console.log("New client connected", socket.id);
    let userId = null;

    // Handle user connection and store in onlineUsers map
    socket.on(actions.USER_CONNECTED, async (connectedUserId) => {
      try {
        userId =
          typeof connectedUserId === "object"
            ? connectedUserId?.userId
            : connectedUserId;

        if (!userId) return;

        onlineUsers.set(userId, socket.id);
        socket.join(userId);

        // Update user's isOnline status in DB
        await prisma.user.update({
          where: { id: userId },
          data: { isOnline: true, lastSeen: new Date() },
        });

        // Notify all clients about the updated online users list
        io.emit(actions.USER_STATUS_UPDATE, { userId, isOnline: true });
      } catch (error) {
        console.error("Error in USER_CONNECTED:", error);
      }
    });

    // Return online status of requested users
    socket.on(actions.GET_USER_STATUS, async (requestedUserId, callback) => {
      const isOnline = onlineUsers.has(requestedUserId);
      let lastSeen = null;

      if (!isOnline) {
        const user = await prisma.user.findUnique({
          where: { id: requestedUserId },
          select: { lastSeen: true },
        });
        lastSeen = user?.lastSeen || null;
      }

      callback({ userId: requestedUserId, isOnline, lastSeen });
    });

    socket.on(actions.SEND_MESSAGE, (message) => {
      try {
        const receiverSocketId = onlineUsers.get(message.receiver?.id);

        if (receiverSocketId) {
          io.to(receiverSocketId).emit(actions.RECEIVE_MESSAGE, message);
        }
      } catch (error) {
        console.error("Error in SEND_MESSAGE:", error);
        socket.emit(actions.SEND_MESSAGE_ERROR, {
          error: "Failed to send message",
        });
      }
    });

    // update messages read and notify user
    socket.on(actions.MESSAGE_READ, async (payload, senderIdArg) => {
      try {
        const messageIds = Array.isArray(payload)
          ? payload
          : payload?.messageIds;
        const senderId = Array.isArray(payload) ? senderIdArg : payload?.senderId;

        if (!messageIds?.length || !userId) return;

        await prisma.message.updateMany({
          where: {
            id: { in: messageIds },
            receiverId: userId,
          },
          data: { messageStatus: "READ" },
        });

        const senderSocketId = onlineUsers.get(senderId);

        if (senderSocketId) {
          messageIds.forEach((messageId) => {
            io.to(senderSocketId).emit(actions.MESSAGE_STATUS_UPDATED, {
              messageId,
              messageStatus: "READ",
            });
          });
        }
      } catch (error) {
        console.error("Error updating message read status", error);
      }
    });

    // Handle typing start event and stop after 3 sec
    socket.on(actions.TYPING_START, ({ conversationId, receiverId }) => {
      if (!userId || !conversationId || !receiverId) return;

      if (!typingUsers.has(userId)) typingUsers.set(userId, {});

      const userTyping = typingUsers.get(userId);

      userTyping[conversationId] = true;

      //clear any existing timeout
      if (userTyping[`${conversationId}_timeout`]) {
        clearTimeout(userTyping[`${conversationId}_timeout`]);
      }

      //auto-stop after 3 sec
      userTyping[`${conversationId}_timeout`] = setTimeout(() => {
        userTyping[conversationId] = false;
        socket.to(receiverId).emit(actions.USER_TYPING, {
          userId,
          conversationId,
          isTyping: false,
        });
      }, 3000);

      // Notify receiver
      socket.to(receiverId).emit(actions.USER_TYPING, {
        userId,
        conversationId,
        isTyping: true,
      });
    });

    socket.on(actions.TYPING_STOP, ({ conversationId, receiverId }) => {
      if (!userId || !conversationId || !receiverId) return;

      if (typingUsers.has(userId)) {
        const userTyping = typingUsers.get(userId);
        userTyping[conversationId] = false;

        if (userTyping[`${conversationId}_timeout`]) {
          clearTimeout(userTyping[`${conversationId}_timeout`]);
          delete userTyping[`${conversationId}_timeout`];
        }
      }

      socket.to(receiverId).emit(actions.USER_TYPING, {
        userId,
        conversationId,
        isTyping: false,
      });
    });

    //Add or update reactions on message
    socket.on(
      actions.ADD_REACTION,
      async ({ messageId, emoji, reaction, userId: payloadUserId, reactionUserId, senderId }) => {
        try {
          const emojiValue = emoji || reaction;
          const reactingUserId = reactionUserId || payloadUserId || senderId || userId;

          if (!messageId || !emojiValue || !reactingUserId) return;

          const message = await prisma.message.findFirst({
            where: { id: messageId },
          });

          if (!message) return;

          const existing = await prisma.reaction.findFirst({
            where: { messageId, userId: reactingUserId },
          });

          if (existing) {
            if (existing.emoji === emojiValue) {
              await prisma.reaction.delete({ where: { id: existing.id } });
            } else {
              await prisma.reaction.update({
                where: { id: existing.id },
                data: { emoji: emojiValue },
              });
            }
          } else {
            await prisma.reaction.create({
              data: {
                messageId,
                userId: reactingUserId,
                emoji: emojiValue,
              },
            });
          }

          const populatedMessage = await prisma.message.findUnique({
            where: { id: messageId },
            include: {
              sender: {
                select: {
                  id: true,
                  username: true,
                  profilePicture: true,
                },
              },
              receiver: {
                select: {
                  id: true,
                  username: true,
                  profilePicture: true,
                },
              },
              reactions: {
                select: {
                  userId: true,
                  messageId: true,
                  emoji: true,
                },
              },
            },
          });

          const reactionUpdated = {
            messageId,
            reactions: populatedMessage.reactions,
          };

          const senderSocketId = onlineUsers.get(populatedMessage.sender.id);
          const receiverSocketId = onlineUsers.get(
            populatedMessage.receiver.id
          );

          if (senderSocketId) {
            io.to(senderSocketId).emit(
              actions.REACTION_UPDATE,
              reactionUpdated
            );
          }
          if (receiverSocketId && receiverSocketId !== senderSocketId) {
            io.to(receiverSocketId).emit(
              actions.REACTION_UPDATE,
              reactionUpdated
            );
          }
        } catch (error) {
          console.error("Error in ADD_REACTION:", error);
        }
      }
    );

    // Handle user disconnect mark user offline
    socket.on(actions.DISCONNECT, async () => {
      if (!userId) return;

      try {
        onlineUsers.delete(userId);

        // clear all typing timeouts
        if (typingUsers.has(userId)) {
          const userTyping = typingUsers.get(userId);
          Object.keys(userTyping).forEach((key) => {
            if (key.endsWith("_timeout")) {
              clearTimeout(userTyping[key]);
            }
          });
          typingUsers.delete(userId);
        }

        // Update user's isOnline status in DB
        await prisma.user.update({
          where: { id: userId },
          data: { isOnline: false, lastSeen: new Date() },
        });

        // Notify all clients about the updated online users list
        io.emit(actions.USER_STATUS_UPDATE, { userId, isOnline: false });

        socket.leave(userId);
        console.log("Client disconnected", socket.id);
      } catch (error) {
        console.error("Error in DISCONNECT:", error);
      }
    });
  });

  // Store io instance and onlineUsers map for external use
  io.socketUserMap = onlineUsers;

  return io;
};

module.exports = { initializeSocket };
