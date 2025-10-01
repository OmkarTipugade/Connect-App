const { uploadFileToCloudinary } = require("../config/cloudinary.config");
const { PrismaClient } = require("@prisma/client");
const { response } = require("../utils/responseHandler");
const { actions } = require("../utils/actions");
const prisma = new PrismaClient();

const createStatus = async (req, res) => {
  try {
    const { content, contentType } = req.body;
    const userId = req.user?.userID || req.user.userId;
    const file = req.file;

    let mediaUrl = null;
    let fileContentType = contentType?.toUpperCase() || "TEXT";

    if (file) {
      const uploadFile = await uploadFileToCloudinary(file);

      if (!uploadFile?.secure_url) {
        return response(res, 500, "File upload failed");
      }

      mediaUrl = uploadFile.secure_url;

      fileContentType = file.mimetype.startsWith("image") ? "IMAGE" : "VIDEO";

      if (fileContentType !== "IMAGE" && fileContentType !== "VIDEO") {
        return response(
          res,
          400,
          "Invalid file type. Only images and videos are allowed"
        );
      }
    } else if (content?.trim()) {
      fileContentType = "TEXT";
    } else {
      return response(res, 400, "Message content cannot be empty");
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const status = await prisma.status.create({
      data: {
        userId: userId,
        content: mediaUrl || content,
        contentType: fileContentType,
        expiresAt,
      },
    });

    // Fetch status with user info
    const populatedStatus = await prisma.status.findUnique({
      where: { id: status.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Fetch viewers from StatusView
    const viewers = await prisma.statusView.findMany({
      where: { statusId: status.id },
      select: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (req.io && req.socketUserMap) {
      //Broadcast to all connecting users except the creator
      for (const [connectedUserId, socketId] of req.socketUserMap) {
        req.io.to(socketId).emit(actions.NEW_STATUS, populatedStatus);
      }
    }

    return response(res, 200, "Status created successfully", {
      status: {
        ...populatedStatus,
        viewedBy: viewers.map((v) => v.user),
      },
    });
  } catch (error) {
    console.error("Error in createStatus:", error);
    return response(res, 500, "Internal Server Error");
  }
};

const getStatuses = async (req, res) => {
  try {
    const statuses = await prisma.status.findMany({
      where: {
        expiresAt: {
          gt: new Date(), // same as $gt in MongoDB
        },
      },
      include: {
        user: {
          select: {
            username: true,
            profilePicture: true,
          },
        },
        viewedBy: {
          select: {
            username: true,
            profilePicture: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc", // same as .sort({ createdAt: -1 })
      },
    });

    return res.status(200).json({
      message: "Statuses retrieved successfully",
      statuses,
    });
  } catch (error) {
    return response(res, 500, "Internal server error");
  }
};

const viewStatus = async (req, res) => {
  const { storyId } = req.params;
  const userId = req.user?.userID || req.user?.userId;

  if (!userId) {
    return response(res, 400, "User ID is missing");
  }

  try {
    const status = await prisma.status.findUnique({
      where: { id: storyId },
    });

    if (!status) {
      return response(res, 404, "Status not found");
    }

    // Check if the user already viewed this status
    const alreadyViewed = await prisma.statusView.findFirst({
      where: { statusId: storyId, userId: userId },
    });

    if (!alreadyViewed) {
      await prisma.statusView.create({
        data: {
          statusId: storyId,
          userId: userId,
          username: req.user?.username || null,
          profilePicture: req.user?.profilePicture || null,
        },
      });
    }

    const updatedStatus = await prisma.status.findUnique({
      where: { id: storyId },
      include: {
        user: { select: { username: true, profilePicture: true } },
        viewedBy: { select: { username: true, profilePicture: true } },
      },
    });

    if (req.io && req.socketUserMap) {
      //Broadcast to all connecting users except the creator
      const statusAdmin = req.socketUserMap.get(status.userId.toString());
      if (statusAdmin) {
        const viewData = {
          statusId: status.id,
          viewerId: userId,
          totalViewers: updatedStatus.viewedBy.length,
          viewers: updatedStatus.viewedBy,
        };

        res.io.to(statusAdmin).emit(actions.STATUS_VIEWED, viewData);
      }
    } else {
      console.error("Status admin not connected");
    }

    return response(res, 200, "Status viewed successfully", updatedStatus);
  } catch (error) {
    console.error("Error in viewStatus:", error);
    return response(res, 500, "Internal server error");
  }
};

const deleteStatus = async (req, res) => {
  const { storyId } = req.params;
  const userId = req.user?.userId || req.user?.userID;

  try {
    const status = await prisma.status.findUnique({
      where: {
        id: storyId,
      },
    });

    if (!status) {
      return response(res, 404, "Status not found");
    }

    if (status.userId !== userId) {
      return response(res, 403, "Not authorized to delete status");
    }
    await prisma.statusView.deleteMany({
      where: { statusId: storyId },
    });

    await prisma.status.delete({
      where: { id: storyId },
    });

    if (req.io && req.socketUserMap) {
      for (const [connectedUserId, socketId] of req.socketUserMap) {
        if (connectedUserId !== userId) {
          req.io.to(socketId).emit(actions.STATUS_DELETED, storyId);
        }
      }
    }
    return response(res, 200, "Status deleted successfully");
  } catch (error) {
    console.error("Error in deleteStatus:", error);
    return response(res, 500, "Internal server error");
  }
};

module.exports = {
  createStatus,
  getStatuses,
  deleteStatus,
  viewStatus,
};
