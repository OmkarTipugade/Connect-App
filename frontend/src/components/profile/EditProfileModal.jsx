import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaUser, FaCamera } from "react-icons/fa";
import { toast } from "react-toastify";
import { updateUserProfile } from "../../services/user.service";
import useUserStore from "../../store/UseUserStore";
import useThemeStore from "../../store/themeStore";

const avatars = [
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Luna",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Aneka",
];

const EditProfileModal = ({ open, onClose }) => {
  const { theme } = useThemeStore();
  const { user, setUser } = useUserStore();
  const isDark = theme === "dark";

  const [username, setUsername] = useState(user?.username || "");
  const [about, setAbout] = useState(user?.about || "");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(user?.profilePicture || "");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("about", about);
      if (file) {
        formData.append("profilePicture", file);
      } else if (preview && preview.startsWith("http")) {
        formData.append("profilePicture", preview);
      }
      const response = await updateUserProfile(formData);
      if (response?.data?.user) {
        setUser(response.data.user);
      }
      toast.success("Profile updated");
      onClose();
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`w-full max-w-md rounded-2xl p-6 shadow-xl ${
            isDark ? "bg-[#202c33] text-white" : "bg-white"
          }`}
        >
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-semibold">Edit profile</h2>
            <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-black/10">
              <FaTimes />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <img
                  src={preview || "/default-avatar.png"}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
                <label className="absolute bottom-0 right-0 bg-red-500 text-white p-2 rounded-full cursor-pointer">
                  <FaCamera className="w-3 h-3" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setFile(f);
                        setPreview(URL.createObjectURL(f));
                      }
                    }}
                  />
                </label>
              </div>
              <div className="flex gap-2">
                {avatars.map((a) => (
                  <img
                    key={a}
                    src={a}
                    alt=""
                    onClick={() => { setPreview(a); setFile(null); }}
                    className="w-10 h-10 rounded-full cursor-pointer hover:ring-2 ring-red-500"
                  />
                ))}
              </div>
            </div>

            <div className="relative">
              <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                required
                minLength={3}
                className={`w-full pl-10 pr-3 py-2 rounded-lg border focus:ring-2 focus:ring-red-500 outline-none ${
                  isDark ? "bg-gray-800 border-gray-700" : "border-gray-300"
                }`}
              />
            </div>

            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="About"
              rows={3}
              maxLength={200}
              className={`w-full p-3 rounded-lg border resize-none focus:ring-2 focus:ring-red-500 outline-none ${
                isDark ? "bg-gray-800 border-gray-700" : "border-gray-300"
              }`}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 transition"
            >
              {loading ? "Saving..." : "Save changes"}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditProfileModal;
