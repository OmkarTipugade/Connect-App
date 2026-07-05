import { FaTimes } from "react-icons/fa";
import useThemeStore from "../../store/themeStore";

const MediaGalleryModal = ({ messages, open, onClose }) => {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  if (!open) return null;

  const media = messages.filter(
    (m) =>
      (m.contentType === "IMAGE" || m.contentType === "VIDEO") && m.imageOrVideoUrl,
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
      <div className="flex items-center justify-between p-4 text-white">
        <h2 className="font-semibold">Media ({media.length})</h2>
        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10">
          <FaTimes />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {media.length === 0 ? (
          <p className={`text-center py-12 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            No media in this chat
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {media.map((m) => (
              <div key={m.id} className="aspect-square rounded-lg overflow-hidden bg-gray-800">
                {m.contentType === "IMAGE" ? (
                  <img src={m.imageOrVideoUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <video src={m.imageOrVideoUrl} className="w-full h-full object-cover" controls />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaGalleryModal;
