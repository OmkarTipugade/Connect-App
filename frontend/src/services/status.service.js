import axiosInstance from "./url.service";

export const fetchStatuses = () => axiosInstance.get("/api/story");

export const createStatus = (formData) =>
  axiosInstance.post("/api/story", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const viewStatus = (storyId) =>
  axiosInstance.put(`/api/story/${storyId}/view`);

export const deleteStatus = (storyId) =>
  axiosInstance.delete(`/api/story/${storyId}`);
