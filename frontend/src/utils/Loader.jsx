import { motion } from "framer-motion";
import useThemeStore from "../store/themeStore";
import connectLogo from "../assets/connect-logo.png";

const Loader = () => {
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === "dark";

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center z-50 ${
        isDark ? "bg-[#111b21]" : "bg-gray-100"
      }`}
    >
      <motion.img
        src={connectLogo}
        alt="Connect"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.45,
          type: "spring",
          stiffness: 260,
          damping: 22,
        }}
        className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-contain shadow-lg mb-8"
      />

      <div
        className={`w-48 h-1 rounded-full overflow-hidden mb-4 ${
          isDark ? "bg-gray-700" : "bg-gray-200"
        }`}
      >
        <motion.div
          className="h-full rounded-full bg-red-500"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.2, ease: "easeInOut", repeat: Infinity }}
        />
      </div>

      <p
        className={`text-sm font-medium tracking-wide ${
          isDark ? "text-gray-300" : "text-gray-600"
        }`}
      >
        Loading Connect...
      </p>
    </div>
  );
};

export default Loader;
