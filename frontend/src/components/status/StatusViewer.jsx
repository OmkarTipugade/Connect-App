import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaTrash, FaReply, FaEye, FaChevronUp } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  STATUS_DURATION_MS,
  useStatusStore,
} from "../../store/statusStore";
import useUserStore from "../../store/UseUserStore";
import useLayoutStore from "../../store/layoutStore";
import { useChatStore } from "../../store/chatStore";
import StatusProgressBar from "./StatusProgressBar";
import StatusViewersSheet from "./StatusViewersSheet";
import formatTimestamp from "../../utils/formatTime";

const StatusViewer = () => {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const setSelectedContact = useLayoutStore((state) => state.setSelectedContact);
  const setCurrentConversation = useChatStore((state) => state.setCurrentConversation);
  const clearMessages = useChatStore((state) => state.clearMessages);

  const {
    viewerOpen,
    viewerGroup,
    viewerIndex,
    closeViewer,
    setViewerIndex,
    markStatusViewed,
    deleteStatus,
  } = useStatusStore();

  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [viewersOpen, setViewersOpen] = useState(false);
  const timerRef = useRef(null);
  const startRef = useRef(Date.now());
  const viewedRef = useRef(new Set());

  const statuses = viewerGroup?.statuses ?? [];
  const current = statuses[viewerIndex];
  const isOwn = viewerGroup?.userId === user?.id;

  useEffect(() => {
    setViewersOpen(false);
  }, [viewerIndex, current?.id]);

  useEffect(() => {
    if (!viewerOpen || !current?.id) return;

    if (!viewedRef.current.has(current.id) && !isOwn) {
      viewedRef.current.add(current.id);
      markStatusViewed(current.id);
    }
  }, [viewerOpen, current?.id, isOwn, markStatusViewed]);

  useEffect(() => {
    if (!viewerOpen || paused || viewersOpen || !current) return;

    startRef.current = Date.now();
    setProgress(0);

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const p = Math.min(elapsed / STATUS_DURATION_MS, 1);
      setProgress(p);

      if (p >= 1) {
        if (viewerIndex < statuses.length - 1) {
          setViewerIndex(viewerIndex + 1);
        } else {
          closeViewer();
        }
      }
    }, 50);

    return () => clearInterval(timerRef.current);
  }, [viewerOpen, viewerIndex, paused, viewersOpen, current?.id, statuses.length, setViewerIndex, closeViewer]);

  const goNext = () => {
    if (viewerIndex < statuses.length - 1) {
      setViewerIndex(viewerIndex + 1);
    } else {
      closeViewer();
    }
  };

  const goPrev = () => {
    if (viewerIndex > 0) {
      setViewerIndex(viewerIndex - 1);
    }
  };

  const handleDelete = async () => {
    if (!current?.id) return;
    const ok = await deleteStatus(current.id);
    if (ok) {
      if (statuses.length <= 1) {
        closeViewer();
      } else if (viewerIndex >= statuses.length - 1) {
        setViewerIndex(viewerIndex - 1);
      }
    }
  };

  const handleReply = () => {
    if (!viewerGroup || isOwn) return;
    setSelectedContact({
      id: viewerGroup.userId,
      username: viewerGroup.username,
      profilePicture: viewerGroup.profilePicture,
      conversation: null,
    });
    clearMessages();
    setCurrentConversation(null);
    closeViewer();
    navigate("/");
  };

  const handleTap = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const third = rect.width / 3;
    if (x < third) goPrev();
    else if (x > third * 2) goNext();
  };

  if (!viewerOpen || !viewerGroup || !current) return null;

  const viewerCount = current.viewedBy?.length ?? 0;
  const viewers = current.viewedBy ?? [];

  const openViewers = () => {
    setPaused(true);
    setViewersOpen(true);
  };

  const closeViewers = () => {
    setViewersOpen(false);
    setPaused(false);
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="status-viewer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black flex flex-col"
      >
        <StatusProgressBar
          total={statuses.length}
          currentIndex={viewerIndex}
          progress={progress}
          paused={paused}
        />

        <div className="flex items-center justify-between px-4 py-2 text-white">
          <div className="flex items-center gap-3">
            <img
              src={viewerGroup.profilePicture || "/default-avatar.png"}
              alt=""
              className="w-9 h-9 rounded-full object-cover"
            />
            <div>
              <p className="font-medium text-sm">{viewerGroup.username}</p>
              <p className="text-xs text-white/70">
                {formatTimestamp(current.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isOwn && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-2 hover:bg-white/10 rounded-full transition"
                aria-label="Delete status"
              >
                <FaTrash className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={closeViewer}
              className="p-2 hover:bg-white/10 rounded-full transition"
              aria-label="Close"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div
          className="flex-1 relative flex items-center justify-center select-none"
          onClick={handleTap}
          onMouseDown={() => setPaused(true)}
          onMouseUp={() => setPaused(false)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          {current.contentType === "TEXT" && (
            <div className="w-full h-full flex items-center justify-center p-8 bg-linear-to-br from-red-600 via-purple-700 to-indigo-800">
              <p className="text-white text-2xl md:text-3xl text-center font-medium leading-relaxed max-w-lg">
                {current.content}
              </p>
            </div>
          )}

          {current.contentType === "IMAGE" && (
            <img
              src={current.content}
              alt="Status"
              className="max-h-full max-w-full object-contain"
            />
          )}

          {current.contentType === "VIDEO" && (
            <video
              src={current.content}
              className="max-h-full max-w-full object-contain"
              autoPlay
              muted
              playsInline
              loop
            />
          )}

          {!["TEXT", "IMAGE", "VIDEO"].includes(current.contentType) && (
            <div className="w-full h-full flex items-center justify-center p-8">
              <p className="text-white/80 text-center">
                {current.content || "Unable to display this status"}
              </p>
            </div>
          )}
        </div>

        <div className="px-4 py-3 flex items-center justify-between text-white">
          {isOwn ? (
            <button
              type="button"
              onClick={openViewers}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 transition text-sm"
            >
              <FaEye className="w-3.5 h-3.5" />
              <span>
                {viewerCount} view{viewerCount !== 1 ? "s" : ""}
              </span>
              <FaChevronUp className="w-3 h-3 opacity-70" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReply}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition text-sm"
            >
              <FaReply className="w-3 h-3" />
              Reply
            </button>
          )}
          <p className="text-xs text-white/50">
            Expires {formatTimestamp(current.expiresAt)}
          </p>
        </div>

        <StatusViewersSheet
          open={viewersOpen && isOwn}
          onClose={closeViewers}
          viewers={viewers}
        />
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
};

export default StatusViewer;
