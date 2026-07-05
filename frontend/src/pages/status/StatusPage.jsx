import { useEffect } from "react";
import { FaPlus } from "react-icons/fa";
import { motion } from "framer-motion";
import {
  groupStatusesByUser,
  useStatusStore,
} from "../../store/statusStore";
import useUserStore from "../../store/UseUserStore";
import useThemeStore from "../../store/themeStore";
import StatusRing from "../../components/status/StatusRing";
import StatusSkeleton from "../../components/status/StatusSkeleton";
import StatusViewer from "../../components/status/StatusViewer";
import CreateStatusModal from "../../components/status/CreateStatusModal";

const StatusPage = () => {
  const { theme } = useThemeStore();
  const user = useUserStore((state) => state.user);
  const {
    statuses,
    loading,
    fetchStatuses,
    openViewer,
    openCreateModal,
    removeExpiredStatuses,
  } = useStatusStore();

  useEffect(() => {
    fetchStatuses();
    const expiryTimer = setInterval(removeExpiredStatuses, 60000);
    return () => clearInterval(expiryTimer);
  }, [fetchStatuses, removeExpiredStatuses]);

  const groups = groupStatusesByUser(statuses, user?.id);
  const myGroup = groups.find((g) => g.userId === user?.id);
  const otherGroups = groups.filter((g) => g.userId !== user?.id);

  const isDark = theme === "dark";

  const openMyStatus = () => {
    if (myGroup) {
      openViewer(myGroup, 0);
    } else {
      openCreateModal();
    }
  };

  return (
    <>
      <div className={`min-h-full ${isDark ? "text-white" : "text-gray-900"}`}>
        <div
          className={`px-4 py-3 border-b ${
            isDark ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <p className="text-sm opacity-70">
            Status updates disappear after 24 hours.
          </p>
        </div>

        {loading ? (
          <StatusSkeleton />
        ) : (
          <>
            <div className="px-4 py-6">
              <h2 className="text-sm font-medium opacity-70 mb-4">My status</h2>
              <div className="flex gap-4">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={openCreateModal}
                  className="flex flex-col items-center gap-2 shrink-0"
                >
                  <div
                    className={`w-[62px] h-[62px] rounded-full flex items-center justify-center border-2 border-dashed ${
                      isDark ? "border-gray-600 bg-gray-800" : "border-gray-300 bg-gray-100"
                    }`}
                  >
                    <FaPlus className="w-5 h-5 text-red-500" />
                  </div>
                  <span className="text-xs">Add status</span>
                </motion.button>

                {myGroup && (
                  <StatusRing
                    group={{ ...myGroup, hasUnseen: false }}
                    isOwn
                    onClick={openMyStatus}
                  />
                )}
              </div>
            </div>

            <div className="px-4 pb-6">
              <h2 className="text-sm font-medium opacity-70 mb-4">
                Recent updates
              </h2>
              {otherGroups.length === 0 ? (
                <div
                  className={`text-center py-12 rounded-2xl ${
                    isDark ? "bg-gray-800/50" : "bg-gray-50"
                  }`}
                >
                  <p className="text-4xl mb-3">📱</p>
                  <p className="font-medium">No status updates</p>
                  <p className="text-sm opacity-60 mt-1">
                    When contacts post status, you'll see them here
                  </p>
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {otherGroups.map((group) => {
                    const firstUnseen = group.statuses.findIndex(
                      (s) =>
                        !s.viewedBy?.some((v) => v.userId === user?.id),
                    );
                    const startIndex = firstUnseen >= 0 ? firstUnseen : 0;
                    return (
                      <StatusRing
                        key={group.userId}
                        group={group}
                        onClick={() => openViewer(group, startIndex)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <StatusViewer />
      <CreateStatusModal />
    </>
  );
};

export default StatusPage;
