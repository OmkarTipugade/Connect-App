import { motion, AnimatePresence } from "framer-motion";

const ProfilePictureViewer = ({ src, open, onClose }) => {
  if (!open || !src) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.img
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          src={src}
          alt="Profile"
          className="max-w-full max-h-full object-contain rounded-lg cursor-zoom-out"
          onClick={(e) => e.stopPropagation()}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default ProfilePictureViewer;
