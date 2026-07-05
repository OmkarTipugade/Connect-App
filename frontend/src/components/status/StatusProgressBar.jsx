import { motion } from "framer-motion";

const StatusProgressBar = ({ total, currentIndex, progress, paused }) => {
  return (
    <div className="flex gap-1 px-3 pt-3 pb-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
        >
          {i < currentIndex && (
            <div className="h-full w-full bg-white rounded-full" />
          )}
          {i === currentIndex && (
            <motion.div
              className="h-full bg-white rounded-full origin-left"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: paused ? progress : 1 }}
              transition={
                paused
                  ? { duration: 0 }
                  : { duration: (1 - progress) * 5, ease: "linear" }
              }
              style={{ transformOrigin: "left" }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default StatusProgressBar;
