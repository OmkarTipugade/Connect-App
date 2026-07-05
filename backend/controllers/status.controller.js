const { uploadFileToCloudinary } = require("../config/cloudinary.config");
const { response } = require("../utils/responseHandler");
const { actions } = require("../utils/actions");
const prisma = require("../prismaClient");

const statusViewedBySelect = {
  id: true,
  userId: true,
  username: true,
  profilePicture: true,
  viewedAt: true,
  user: {
    select: {
      username: true,
      profilePicture: true,
      phoneSuffix: true,
    },
  },
};

const mapViewer = (view) => ({
  id: view.id,
  userId: view.userId,
  username:
    view.user?.username ||
    view.username ||
    view.user?.phoneSuffix ||
    "User",
  profilePicture: view.user?.profilePicture || view.profilePicture || null,
  viewedAt: view.viewedAt,
});

const mapStatusViewers = (status) => ({
  ...status,
  viewedBy: (status.viewedBy || []).map(mapViewer),
});

const createStatus = async (req, res) => {
  try {
    const { content, contentType } = req.body;
    const userId = req.authUserId;
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
      status: mapStatusViewers({
        ...populatedStatus,
        viewedBy: viewers.map((v) => ({
          id: v.user?.id,
          userId: v.user?.id,
          username: v.user?.username,
          profilePicture: null,
          viewedAt: new Date(),
          user: v.user,
        })),
      }),
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
          select: statusViewedBySelect,
        },
      },
      orderBy: {
        createdAt: "desc", // same as .sort({ createdAt: -1 })
      },
    });

    return res.status(200).json({
      message: "Statuses retrieved successfully",
      statuses: statuses.map(mapStatusViewers),
    });
  } catch (error) {
    return response(res, 500, "Internal server error");
  }
};

const viewStatus = async (req, res) => {
  const { storyId } = req.params;
  const userId = req.authUserId;

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
      const viewer = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true, profilePicture: true, phoneSuffix: true },
      });

      const viewerName =
        viewer?.username || viewer?.phoneSuffix || null;

      await prisma.statusView.create({
        data: {
          statusId: storyId,
          userId: userId,
          username: viewerName,
          profilePicture: viewer?.profilePicture || null,
        },
      });
    }

    const updatedStatus = await prisma.status.findUnique({
      where: { id: storyId },
      include: {
        user: { select: { username: true, profilePicture: true } },
        viewedBy: { select: statusViewedBySelect },
      },
    });

    const normalizedStatus = mapStatusViewers(updatedStatus);

    if (req.io && req.socketUserMap) {
      //Broadcast to all connecting users except the creator
      const statusAdmin = req.socketUserMap.get(status.userId.toString());
      if (statusAdmin) {
        const viewData = {
          statusId: status.id,
          viewerId: userId,
          totalViewers: normalizedStatus.viewedBy.length,
          viewers: normalizedStatus.viewedBy,
        };

        req.io.to(statusAdmin).emit(actions.STATUS_VIEWED, viewData);
      }
    } else {
      console.error("Status admin not connected");
    }

    return response(res, 200, "Status viewed successfully", normalizedStatus);
  } catch (error) {
    console.error("Error in viewStatus:", error);
    return response(res, 500, "Internal server error");
  }
};

const deleteStatus = async (req, res) => {
  const { storyId } = req.params;
  const userId = req.authUserId;

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
