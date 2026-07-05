import axios from "axios";

/** In dev, use Vite proxy (same origin). In prod, set VITE_API_BASE_URL. */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export default axiosInstance;
