const express = require("express");
const {
  sendMessage,
  markMessagesAsRead,
  getMessagesOfSpecificChat,
  getConversation,
  deleteMessage,
  starMessage,
  unstarMessage,
  getStarredMessages,
  editMessage,
  pinMessage,
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
router.put("/messages/:messageId/pin", authMiddleware, pinMessage);
router.post("/messages/:messageId/star", authMiddleware, starMessage);
router.delete("/messages/:messageId/star", authMiddleware, unstarMessage);
router.put("/messages/:messageId", authMiddleware, editMessage);
router.get("/conversations", authMiddleware, getConversation);
router.delete("/delete-message/:messageId", authMiddleware, deleteMessage);
router.get("/starred-messages", authMiddleware, getStarredMessages);

module.exports = router;
