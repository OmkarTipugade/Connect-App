const { uploadFileToCloudinary } = require("../config/cloudinary.config");
const { PrismaClient } = require("@prisma/client");
const { response } = require("../utils/responseHandler");
const prisma = new PrismaClient();

const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content, messageStatus } = req.body;
    const file = req.file;

    if (!senderId || !receiverId || (!content && !file)) {
      return response(res, 400, "Missing required fields");
    }

    const participants = [senderId, receiverId].sort();

    //check if conversation exists between sender and receiver
    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { members: { some: { id: senderId } } },
          { members: { some: { id: receiverId } } },
        ],
      },
      include: {
        members: { select: { id: true, username: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          members: {
            connect: [{ id: senderId }, { id: receiverId }],
          },
        },
        include: {
          members: {
            select: { id: true, username: true, profilePicture: true },
          },
        },
      });
    }

    let imageOrVideoUrl = null;
    let contentType = null;

    // handle file upload if file is present
    if (file) {
      const uploadFile = await uploadFileToCloudinary(file);

      if (uploadFile?.secure_url) {
        return response(res, 500, "File upload failed");
      }
      imageOrVideoUrl = uploadFile.secure_url;

      contentType = file.mimetype.startsWith("image") ? "IMAGE" : "VIDEO";

      if (contentType !== "IMAGE" && contentType !== "VIDEO") {
        return response(
          res,
          400,
          "Invalid file type. Only images and videos are allowed"
        );
      }
    } else if (content?.trim()) {
      contentType = "TEXT";
    } else {
      return response(res, 400, "Message content cannot be empty");
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId,
        receiverId,
        content: content || "",
        contentType,
        imageOrVideoUrl,
        messageStatus: messageStatus || "SENT",
      },
    });

    if (message?.content) {
      conversation.lastMsgId = message.id;
    }

    conversation.unreadCount += 1;
    conversation = await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMsgId: message.id,
        unreadCount: conversation.unreadCount,
        updatedAt: new Date(),
      },
    });

    const populatedMessage = await prisma.message.findUnique({
      where: { id: message?.id },
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

    return response(res, 200, "Message sent successfully", {
      message: populatedMessage,
    });
  } catch (error) {
    console.error("Error in sendMessage:", error);
    return response(res, 500, "Internal Server Error");
  }
};

const getConversation = async (req, res) => {
  const userId = req.user.userId;

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: { id: userId },
        },
      },
      include: {
        members: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            isOnline: true,
            lastSeen: true,
          },
        },
        lastMsg: {
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
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return res
      .status(201)
      .json({ message: "Conversation get successfully", conversations });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong", error });
  }
};

const getMessagesOfSpecificChat = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.userId || req.user?.userID;
  try {
    // 1. Check if conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: parseInt(conversationId) },
      include: { members: true },
    });

    if (!conversation) {
      return response(res, 404, "Conversation not found");
    }

    // 2. Check if user is a participant
    const isParticipant = conversation.members.some((p) => p.id === userId);
    if (!isParticipant) {
      return response(res, 403, "Not authorized to view this conversation");
    }

    // 3. Fetch all messages for this conversation
    const messages = await prisma.message.findMany({
      where: { conversationId: parseInt(conversationId) },
      include: {
        sender: { select: { id: true, username: true, profilePicture: true } },
        receiver: {
          select: { id: true, username: true, profilePicture: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    conversation.unreadCount = 0;
    // 4. Mark user’s received messages as READ
    await prisma.message.updateMany({
      where: {
        conversationId: parseInt(conversationId),
        receiverId: userId,
        messageStatus: { in: ["SENT", "DELIVERED"] },
      },
      data: {
        messageStatus: "READ",
        updatedAt: new Date(),
      },
    });

    return response(res, 200, "Messages fetched successfully", { messages });
  } catch (error) {
    console.error("Error in getMessages:", error);
    return response(res, 500, "Internal Server Error");
  }
};

const markMessagesAsRead = async (req, res) => {
  const { messageIds } = req.body;
  const userId = req.user.userId || req.user?.userID;
  console.log("messageIds", messageIds, userId);

  try {
    // Fetch messages to ensure they belong to the user and are unread
    const messages = await prisma.message.findFirst({
      where: {
        id: messageIds,
        receiverId: userId,
        messageStatus: "SENT",
      },
    });

    if (!messages) {
      return response(res, 200, "No unread messages found", { messages: [] });
    }

    // Update unread messages to READ
    await prisma.message.update({
      where: {
        id: messageIds,
        receiverId: userId,
      },
      data: {
        messageStatus: "READ",
        updatedAt: new Date(),
      },
    });

    return response(res, 200, "Messages marked as read successfully", {
      messages,
    });
  } catch (error) {
    console.error("Error in markMessagesAsRead:", error);
    return response(res, 500, "Internal Server Error");
  }
};

const deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.userId || req.user?.userID;

  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message) {
      return response(res, 404, "Message not found");
    }
    if (message.senderId !== userId) {
      return response(res, 403, "You can only delete your own messages");
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    return response(res, 200, "Message deleted successfully");
  } catch (error) {
    console.error("Error in deleteMessage:", error);
    return response(res, 500, "Internal Server Error");
  }
};
module.exports = {
  sendMessage,
  getConversation,
  getMessagesOfSpecificChat,
  markMessagesAsRead,
  deleteMessage,
};
