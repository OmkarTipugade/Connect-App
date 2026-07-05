import { create } from "zustand";
import { getSocket } from "../services/chat.service";
import {
  createStatus as createStatusApi,
  deleteStatus as deleteStatusApi,
  fetchStatuses as fetchStatusesApi,
  viewStatus as viewStatusApi,
} from "../services/status.service";
import { ACTIONS } from "../utils/actions";

const STATUS_DURATION_MS = 5000;

let statusListenersInitialized = false;

export const groupStatusesByUser = (statuses, currentUserId) => {
  const now = Date.now();
  const active = statuses.filter(
    (s) => new Date(s.expiresAt).getTime() > now,
  );

  const map = new Map();

  for (const status of active) {
    const userId = status.userId;
    if (!map.has(userId)) {
      map.set(userId, {
        userId,
        username: status.user?.username || status.username || "User",
        profilePicture: status.user?.profilePicture || status.profilePicture,
        statuses: [],
        hasUnseen: false,
        isOwn: userId === currentUserId,
      });
    }
    const group = map.get(userId);
    group.statuses.push(status);

    const isViewed = status.viewedBy?.some(
      (v) => v.userId === currentUserId,
    );
    if (!isViewed && userId !== currentUserId) {
      group.hasUnseen = true;
    }
  }

  return Array.from(map.values()).map((group) => ({
    ...group,
    statuses: group.statuses.sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    ),
  }));
};

export const useStatusStore = create((set, get) => ({
  statuses: [],
  loading: false,
  error: null,
  viewerOpen: false,
  viewerGroup: null,
  viewerIndex: 0,
  createModalOpen: false,
  creating: false,

  initStatusSocketListeners: () => {
    const socket = getSocket();
    if (!socket || statusListenersInitialized) return;
    statusListenersInitialized = true;

    socket.off(ACTIONS.NEW_STATUS);
    socket.off(ACTIONS.STATUS_VIEWED);
    socket.off(ACTIONS.STATUS_DELETED);

    socket.on(ACTIONS.NEW_STATUS, (status) => {
      if (!status?.id) return;
      set((state) => {
        const exists = state.statuses.some((s) => s.id === status.id);
        if (exists) return state;
        return { statuses: [status, ...state.statuses] };
      });
    });

    socket.on(ACTIONS.STATUS_VIEWED, ({ statusId, viewers, totalViewers }) => {
      set((state) => {
        const nextViewers = viewers ?? undefined;
        const statuses = state.statuses.map((s) =>
          s.id === statusId
            ? {
                ...s,
                viewedBy: nextViewers ?? s.viewedBy,
                _viewerCount: totalViewers,
              }
            : s,
        );

        let viewerGroup = state.viewerGroup;
        if (viewerGroup?.statuses?.some((s) => s.id === statusId)) {
          viewerGroup = {
            ...viewerGroup,
            statuses: viewerGroup.statuses.map((s) =>
              s.id === statusId
                ? {
                    ...s,
                    viewedBy: nextViewers ?? s.viewedBy,
                    _viewerCount: totalViewers,
                  }
                : s,
            ),
          };
        }

        return { statuses, viewerGroup };
      });
    });

    socket.on(ACTIONS.STATUS_DELETED, (storyId) => {
      set((state) => ({
        statuses: state.statuses.filter((s) => s.id !== storyId),
      }));
    });
  },

  fetchStatuses: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await fetchStatusesApi();
      const statuses = data?.statuses ?? data?.data?.statuses ?? [];
      set({ statuses, loading: false });
      get().initStatusSocketListeners();
      return statuses;
    } catch (error) {
      set({
        error: error?.response?.data?.message || "Failed to load statuses",
        loading: false,
      });
      throw error;
    }
  },

  openViewer: (group, startIndex = 0) => {
    if (!group?.statuses?.length) return;
    const index = Math.min(
      Math.max(0, startIndex),
      group.statuses.length - 1,
    );
    set({
      viewerOpen: true,
      viewerGroup: group,
      viewerIndex: index,
    });
  },

  closeViewer: () => {
    set({ viewerOpen: false, viewerGroup: null, viewerIndex: 0 });
  },

  setViewerIndex: (index) => set({ viewerIndex: index }),

  openCreateModal: () => set({ createModalOpen: true }),
  closeCreateModal: () => set({ createModalOpen: false }),

  markStatusViewed: async (statusId) => {
    try {
      const { data } = await viewStatusApi(statusId);
      const updated = data?.data ?? data;
      if (updated?.id) {
        set((state) => {
          let viewerGroup = state.viewerGroup;
          if (viewerGroup?.statuses?.some((s) => s.id === statusId)) {
            viewerGroup = {
              ...viewerGroup,
              statuses: viewerGroup.statuses.map((s) =>
                s.id === statusId ? { ...s, ...updated } : s,
              ),
            };
          }
          return {
            statuses: state.statuses.map((s) =>
              s.id === statusId ? { ...s, ...updated } : s,
            ),
            viewerGroup,
          };
        });
      }
    } catch (error) {
      console.error("Failed to mark status viewed:", error);
    }
  },

  createStatus: async ({ content, contentType, file }) => {
    set({ creating: true });
    try {
      const formData = new FormData();
      formData.append("contentType", contentType);
      if (contentType === "TEXT") {
        formData.append("content", content);
      }
      if (file) {
        formData.append("file", file);
      }
      const { data } = await createStatusApi(formData);
      const status = data?.data?.status ?? data?.status;
      if (status) {
        set((state) => ({
          statuses: [status, ...state.statuses],
          createModalOpen: false,
        }));
      }
      return status;
    } catch (error) {
      set({
        error: error?.response?.data?.message || "Failed to create status",
      });
      throw error;
    } finally {
      set({ creating: false });
    }
  },

  deleteStatus: async (statusId) => {
    try {
      await deleteStatusApi(statusId);
      set((state) => ({
        statuses: state.statuses.filter((s) => s.id !== statusId),
      }));
      return true;
    } catch (error) {
      console.error("Failed to delete status:", error);
      return false;
    }
  },

  removeExpiredStatuses: () => {
    const now = Date.now();
    set((state) => ({
      statuses: state.statuses.filter(
        (s) => new Date(s.expiresAt).getTime() > now,
      ),
    }));
  },
}));

export { STATUS_DURATION_MS };
