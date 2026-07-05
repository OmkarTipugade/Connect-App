import useThemeStore from "../../store/themeStore";

const StatusSkeleton = () => {
  const { theme } = useThemeStore();
  const base = theme === "dark" ? "bg-gray-700" : "bg-gray-200";

  return (
    <div className="flex gap-4 px-4 py-6 overflow-x-auto">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2 shrink-0">
          <div className={`w-16 h-16 rounded-full ${base} animate-pulse`} />
          <div className={`w-12 h-3 rounded ${base} animate-pulse`} />
        </div>
      ))}
    </div>
  );
};

export default StatusSkeleton;
