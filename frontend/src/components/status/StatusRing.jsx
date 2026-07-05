import { motion } from "framer-motion";

const StatusRing = ({ group, onClick, isOwn = false }) => {
  const ringClass = group.hasUnseen
    ? "bg-gradient-to-tr from-red-500 via-pink-500 to-orange-400 p-[3px]"
    : "bg-gray-400 p-[2px]";

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex flex-col items-center gap-2 shrink-0 cursor-pointer"
    >
      <div className={`rounded-full ${ringClass}`}>
        <div className="rounded-full p-[2px] bg-[#111b21]">
          <img
            src={group.profilePicture || "/default-avatar.png"}
            alt={group.username}
            className="w-14 h-14 rounded-full object-cover"
          />
        </div>
      </div>
      <span className="text-xs max-w-[72px] truncate text-center">
        {isOwn ? "My status" : group.username}
      </span>
    </motion.button>
  );
};

export default StatusRing;
