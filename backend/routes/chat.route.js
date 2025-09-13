const express = require("express");
const {
  sendMessage,
  markMessagesAsRead,
  getMessagesOfSpecificChat,
  getConversation,
  deleteMessage,
} = require("../controllers/chat.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { multerMiddleware } = require("../config/cloudinary.config");
const router = express.Router();

router.post("/send-message", authMiddleware, multerMiddleware, sendMessage);
router.get(
  "/get-messages/:conversationId/messages",
  authMiddleware,
  getMessagesOfSpecificChat
);
router.put("/messages/mark-as-read", authMiddleware, markMessagesAsRead);
router.get("/conversations", authMiddleware, getConversation);
router.delete("/delete-message/:messageId", authMiddleware, deleteMessage);

module.exports = router;
