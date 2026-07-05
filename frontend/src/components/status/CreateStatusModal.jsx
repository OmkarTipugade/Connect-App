import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { FaTimes, FaImage, FaFont } from "react-icons/fa";
import { toast } from "react-toastify";
import { useStatusStore } from "../../store/statusStore";
import useThemeStore from "../../store/themeStore";

const CreateStatusModal = () => {
  const { theme } = useThemeStore();
  const { createModalOpen, closeCreateModal, createStatus, creating } =
    useStatusStore();

  const [mode, setMode] = useState("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  if (!createModalOpen) return null;

  const isDark = theme === "dark";

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    if (selected.type.startsWith("image")) {
      setPreview(URL.createObjectURL(selected));
    } else {
      setPreview("video");
    }
  };

  const resetForm = () => {
    setText("");
    setFile(null);
    setPreview(null);
    setMode("text");
  };

  const handleClose = () => {
    resetForm();
    closeCreateModal();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === "text") {
        if (!text.trim()) {
          toast.error("Enter status text");
          return;
        }
        await createStatus({ content: text.trim(), contentType: "TEXT" });
      } else {
        if (!file) {
          toast.error("Select an image or video");
          return;
        }
        const contentType = file.type.startsWith("video") ? "VIDEO" : "IMAGE";
        await createStatus({ contentType, file });
      }
      toast.success("Status posted!");
      resetForm();
    } catch {
      toast.error("Failed to post status");
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-xl ${
          isDark ? "bg-[#202c33] text-white" : "bg-white text-gray-900"
        }`}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Create status</h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-black/10 transition"
          >
            <FaTimes />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setMode("text")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition ${
              mode === "text"
                ? "bg-red-500 text-white"
                : isDark
                  ? "bg-gray-700"
                  : "bg-gray-100"
            }`}
          >
            <FaFont className="w-3 h-3" /> Text
          </button>
          <button
            type="button"
            onClick={() => setMode("media")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition ${
              mode === "media"
                ? "bg-red-500 text-white"
                : isDark
                  ? "bg-gray-700"
                  : "bg-gray-100"
            }`}
          >
            <FaImage className="w-3 h-3" /> Photo / Video
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "text" ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              maxLength={700}
              className={`w-full rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-red-500 ${
                isDark
                  ? "bg-gray-800 border border-gray-700"
                  : "bg-gray-50 border border-gray-200"
              }`}
            />
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              className={`rounded-xl border-2 border-dashed flex flex-col items-center justify-center min-h-[180px] cursor-pointer transition hover:border-red-400 ${
                isDark ? "border-gray-600 bg-gray-800" : "border-gray-300 bg-gray-50"
              }`}
            >
              {preview === "video" ? (
                <p className="text-sm">📹 {file?.name}</p>
              ) : preview ? (
                <img src={preview} alt="Preview" className="max-h-40 rounded-lg object-cover" />
              ) : (
                <>
                  <FaImage className="w-10 h-10 mb-2 opacity-40" />
                  <p className="text-sm opacity-60">Tap to upload image or video</p>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={creating}
            className="w-full py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 disabled:opacity-50 transition"
          >
            {creating ? "Posting..." : "Post status"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateStatusModal;
