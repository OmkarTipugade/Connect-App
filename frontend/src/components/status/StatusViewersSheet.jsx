import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import formatTimestamp from "../../utils/formatTime";

const getViewerId = (viewer) =>
  viewer?.userId || viewer?.user?.id || viewer?.id;

const getViewerName = (viewer) =>
  viewer?.username ||
  viewer?.user?.username ||
  viewer?.user?.phoneSuffix ||
  "User";

const getViewerPhoto = (viewer) =>
  viewer?.profilePicture ||
  viewer?.user?.profilePicture ||
  "/default-avatar.png";

const StatusViewersSheet = ({ open, onClose, viewers = [] }) => {
  const navigate = useNavigate();

  const sorted = [...viewers].sort(
    (a, b) => new Date(b.viewedAt || 0) - new Date(a.viewedAt || 0),
  );

  const handleViewerClick = (viewer) => {
    const viewerId = getViewerId(viewer);
    if (!viewerId) return;
    onClose();
    navigate(`/user/${viewerId}`);
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Tap the status area above the sheet to dismiss */}
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-0 top-0 bottom-[55vh] z-200 cursor-default"
            aria-label="Close viewers list"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-201 bg-[#1f2c34] rounded-t-2xl max-h-[55vh] flex flex-col shadow-2xl"
          >
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/25" />
            </div>

            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
              <div className="flex items-center gap-2 text-white">
                <FaEye className="w-4 h-4 text-white/70" />
                <h3 className="font-medium">Viewed by {sorted.length}</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 transition text-white"
                aria-label="Close"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <ul className="overflow-y-auto flex-1 py-1">
              {sorted.length === 0 ? (
                <li className="px-4 py-8 text-center text-white/50 text-sm">
                  No views yet. Share your status and check back here.
                </li>
              ) : (
                sorted.map((viewer) => (
                  <li key={getViewerId(viewer)}>
                    <button
                      type="button"
                      onClick={() => handleViewerClick(viewer)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition text-left"
                    >
                      <img
                        src={getViewerPhoto(viewer)}
                        alt=""
                        className="w-11 h-11 rounded-full object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {getViewerName(viewer)}
                        </p>
                        {viewer.viewedAt && (
                          <p className="text-xs text-white/50 mt-0.5">
                            {formatTimestamp(viewer.viewedAt)}
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default StatusViewersSheet;
