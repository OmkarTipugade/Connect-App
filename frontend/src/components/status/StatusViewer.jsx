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
  const progressRef = useRef(0);
  const videoRef = useRef(null);
  const viewedRef = useRef(new Set());

  const statuses = viewerGroup?.statuses ?? [];
  const current = statuses[viewerIndex];
  const isOwn = viewerGroup?.userId === user?.id;
  const isPlaybackPaused = paused || viewersOpen;
  const mediaType = (current?.contentType || "").toUpperCase();

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (!viewerOpen || !current?.id) return;
    setViewersOpen(false);
    setPaused(false);
    setProgress(0);
    progressRef.current = 0;
    startRef.current = Date.now();
  }, [viewerOpen, viewerIndex, current?.id]);

  useEffect(() => {
    if (!viewerOpen || !current?.id) return;

    if (!viewedRef.current.has(current.id) && !isOwn) {
      viewedRef.current.add(current.id);
      markStatusViewed(current.id);
    }
  }, [viewerOpen, current?.id, isOwn, markStatusViewed]);

  useEffect(() => {
    if (!viewerOpen || isPlaybackPaused || !current) return;

    startRef.current = Date.now() - progressRef.current * STATUS_DURATION_MS;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const p = Math.min(elapsed / STATUS_DURATION_MS, 1);
      setProgress(p);
      progressRef.current = p;

      if (p >= 1) {
        if (viewerIndex < statuses.length - 1) {
          setViewerIndex(viewerIndex + 1);
        } else {
          closeViewer();
        }
      }
    }, 50);

    return () => clearInterval(timerRef.current);
  }, [
    viewerOpen,
    viewerIndex,
    isPlaybackPaused,
    current?.id,
    statuses.length,
    setViewerIndex,
    closeViewer,
  ]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || mediaType !== "VIDEO") return;

    if (isPlaybackPaused) {
      video.pause();
      return;
    }

    video.play().catch(() => {});
  }, [isPlaybackPaused, current?.id, mediaType]);

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

  const openViewers = (e) => {
    e?.stopPropagation?.();
    setPaused(true);
    setViewersOpen(true);
  };

  const closeViewers = (e) => {
    e?.stopPropagation?.();
    setViewersOpen(false);
    setPaused(false);
  };

  const handleTap = (e) => {
    if (viewersOpen) {
      closeViewers();
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const third = rect.width / 3;
    if (x < third) goPrev();
    else if (x > third * 2) goNext();
  };

  if (!viewerOpen || !viewerGroup || !current) return null;

  const viewerCount = current.viewedBy?.length ?? 0;
  const viewers = current.viewedBy ?? [];

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
          paused={isPlaybackPaused}
        />

        <div className="shrink-0 flex items-center justify-between px-4 py-2 text-white relative z-20">
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
          className="flex-1 min-h-0 overflow-hidden relative flex items-center justify-center select-none z-0"
          onClick={handleTap}
          onMouseDown={() => !viewersOpen && setPaused(true)}
          onMouseUp={() => !viewersOpen && setPaused(false)}
          onMouseLeave={() => !viewersOpen && setPaused(false)}
          onTouchStart={() => !viewersOpen && setPaused(true)}
          onTouchEnd={() => !viewersOpen && setPaused(false)}
        >
          {mediaType === "TEXT" && (
            <div className="w-full h-full flex items-center justify-center p-8 bg-linear-to-br from-red-600 via-purple-700 to-indigo-800">
              <p className="text-white text-2xl md:text-3xl text-center font-medium leading-relaxed max-w-lg">
                {current.content}
              </p>
            </div>
          )}

          {mediaType === "IMAGE" && (
            <img
              src={current.content}
              alt="Status"
              className="max-h-full max-w-full object-contain pointer-events-none"
            />
          )}

          {mediaType === "VIDEO" && (
            <video
              ref={videoRef}
              src={current.content}
              className="max-h-full max-w-full object-contain pointer-events-none"
              autoPlay
              muted
              playsInline
              loop
            />
          )}

          {!["TEXT", "IMAGE", "VIDEO"].includes(mediaType) && (
            <div className="w-full h-full flex items-center justify-center p-8">
              <p className="text-white/80 text-center">
                {current.content || "Unable to display this status"}
              </p>
            </div>
          )}
        </div>

        <div className="shrink-0 relative z-20 px-4 py-3 flex items-center justify-between text-white">
          {isOwn ? (
            <button
              type="button"
              onClick={viewersOpen ? closeViewers : openViewers}
              className="relative z-20 flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 transition text-sm"
            >
              <FaEye className="w-3.5 h-3.5" />
              <span>
                {viewerCount} view{viewerCount !== 1 ? "s" : ""}
              </span>
              <FaChevronUp
                className={`w-3 h-3 opacity-70 transition-transform duration-200 ${
                  viewersOpen ? "rotate-180" : ""
                }`}
              />
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
