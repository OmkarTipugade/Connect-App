import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import formatTimestamp from "../../utils/formatTime";

const StatusViewersSheet = ({ open, onClose, viewers = [] }) => {
  const navigate = useNavigate();

  const sorted = [...viewers].sort(
    (a, b) => new Date(b.viewedAt || 0) - new Date(a.viewedAt || 0),
  );

  const handleViewerClick = (viewer) => {
    if (!viewer?.userId) return;
    onClose();
    navigate(`/user/${viewer.userId}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[60]"
            aria-label="Close viewers list"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-[61] bg-[#1f2c34] rounded-t-2xl max-h-[55vh] flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-white">
                <FaEye className="w-4 h-4 text-white/70" />
                <h3 className="font-medium">
                  Viewed by {sorted.length}
                </h3>
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
                  <li key={viewer.userId || viewer.id}>
                    <button
                      type="button"
                      onClick={() => handleViewerClick(viewer)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition text-left"
                    >
                      <img
                        src={viewer.profilePicture || "/default-avatar.png"}
                        alt=""
                        className="w-11 h-11 rounded-full object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {viewer.username || "User"}
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
    </AnimatePresence>
  );
};

export default StatusViewersSheet;
