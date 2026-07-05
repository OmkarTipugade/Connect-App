import axiosInstance from "./url.service";

const sendOtp = async (phone, phoneSuffix, email) => {
  try {
    const response = await axiosInstance.post("/api/auth/send-otp", {
      phone,
      phoneSuffix,
      email,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

const verifyOtp = async (otp, phone, phoneSuffix, email) => {
  try {
    const response = await axiosInstance.post("/api/auth/verify-otp", {
      otp,
      phone,
      phoneSuffix,
      email,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

const updateUserProfile = async (profileData) => {
  try {
    const response = await axiosInstance.put(
      "/api/auth/update-profile",
      profileData,
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

const checkAuthentication = async () => {
  try {
    const response = await axiosInstance.get("/api/auth/check-auth");
    if (response.data.status === "success") {
      const user = response.data.data?.user;
      return { isAuthenticated: Boolean(user?.id), user };
    }
    return { isAuthenticated: false, user: null };
  } catch (error) {
    if (error.response?.status === 401) {
      return { isAuthenticated: false, user: null };
    }
    throw error.response?.data || error.message;
  }
};

const logoutUser = async () => {
  try {
    const response = await axiosInstance.get("/api/auth/logout");
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

const getAllUsers = async () => {
  try {
    const response = await axiosInstance.get("/api/auth/all-users");
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export {
  sendOtp,
  verifyOtp,
  updateUserProfile,
  checkAuthentication,
  logoutUser,
  getAllUsers,
};
