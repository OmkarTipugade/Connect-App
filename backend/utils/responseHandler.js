const response = (res, statusCode, message, data = null) => {
  if (res) {
    if (!res) {
      console.error("Response object is NULL");
      return;
    }
    return res.status(statusCode).json({
      status: statusCode < 400 ? "success" : "error",
      message,
      data,
    });
  }
};

module.exports = { response };
