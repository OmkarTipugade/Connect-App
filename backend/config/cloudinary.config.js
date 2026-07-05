const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const fs = require("fs");
require("@dotenvx/dotenvx").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFileToCloudinary = async (file) => {
  const options = {
    resource_type: file.mimetype.startsWith("video") ? "video" : "image",
  };

  return new Promise((resolve, reject) => {
    const uploader = file.mimetype.startsWith("video")
      ? cloudinary.uploader.upload_large
      : cloudinary.uploader.upload;
    uploader(file.path, options, (error, result) => {
      fs.unlink(file.path, () => {});
      if (error) return reject(error);
      resolve(result);
    });
  });
};

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 },
});

const multerMiddleware = (req, res, next) => {
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ])(req, res, (err) => {
    if (err) return next(err);
    req.file = req.files?.profilePicture?.[0] || req.files?.file?.[0] || null;
    next();
  });
};

module.exports = { uploadFileToCloudinary, multerMiddleware };
