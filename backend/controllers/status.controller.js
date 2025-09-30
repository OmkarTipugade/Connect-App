const { uploadFileToCloudinary } = require("../config/cloudinary.config");
const { PrismaClient } = require("@prisma/client");
const { response } = require("../utils/responseHandler");
const { actions } = require("../utils/actions");
const prisma = new PrismaClient();

const createStatus = async (req, res) => {
  try {
    const { content, contentType } = req.body;
    const userId = req.userId;
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

    const populatedStatus = await prisma.status.findUnique({
      where: { id: status.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        viewers: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return response(res, 200, "Status created successfully", {
      status: populatedStatus,
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
        viewers: {
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
  const { statusId } = req.params;
  const { userId } = req.body; // assuming you send userId in body

  try {
    // 1. Find status
    const status = await prisma.status.findUnique({
      where: { id: statusId },
      include: {
        viewers: { select: { id: true } },
      },
    });

    if (!status) {
      return res.status(404).json({ message: "Status not found" });
    }

    // 2. Check if user already viewed
    const alreadyViewed = status.viewers.some((viewer) => viewer.id === userId);

    if (!alreadyViewed) {
      // 3. Add user to viewers
      await prisma.status.update({
        where: { id: statusId },
        data: {
          viewers: {
            connect: { id: userId }, // connect adds relation in Prisma
          },
        },
      });
    } else {
      console.log("User already viewed the status");
    }

    // 4. Refetch with populated relations
    const updatedStatus = await prisma.status.findUnique({
      where: { id: statusId },
      include: {
        user: {
          select: { username: true, profilePicture: true },
        },
        viewers: {
          select: { username: true, profilePicture: true },
        },
      },
    });

    return res.status(200).json({
      message: "Status viewed successfully",
      status: updatedStatus,
    });
  } catch (error) {
    return response(res, 500, "Internal server error");
  }
};

const deleteStatus = async (req, res) => {
  const { statusId } = req.params;
  const userId = req.user.userId;

  try {
    const status = await prisma.status.findUnique({
      where: {
        id: statusId,
      },
    });

    if (!status) {
      return response(res, 404, "Message not found");
    }
    if (status.userId !== userId) {
      return response(res, 403, "Not authorized to delete status");
    }
  } catch (error) {
    return response(res, 500, "Internal server error");
  }
};

module.exports = {
  createStatus,
  getStatuses,
  deleteStatus, viewStatus
};
