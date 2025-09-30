const express = require("express");
const {
  createStatus,
  getStatuses,
  viewStatus,
  deleteStatus
} = require("../controllers/status.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { multerMiddleware } = require("../config/cloudinary.config");
const router = express.Router();

router.post("/", authMiddleware, multerMiddleware, createStatus);
router.get(
  "/",
  authMiddleware,
  getStatuses
);
router.put("/:storyId/view", authMiddleware, viewStatus);
router.delete("/:storyId", authMiddleware, deleteStatus);

module.exports = router;
