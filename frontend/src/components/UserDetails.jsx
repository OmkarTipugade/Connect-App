import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaEdit, FaArrowLeft, FaEnvelope, FaPhone, FaUser } from "react-icons/fa";
import AppShell from "./AppShell";
import EditProfileModal from "./profile/EditProfileModal";
import ProfilePictureViewer from "./profile/ProfilePictureViewer";
import useUserStore from "../store/UseUserStore";
import useThemeStore from "../store/themeStore";
import { useChatStore } from "../store/chatStore";
import { getAllUsers } from "../services/user.service";
import formatTimestamp from "../utils/formatTime";

const InfoRow = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className="w-4 h-4 mt-1 opacity-50 shrink-0" />
      <div>
        <p className="text-xs opacity-50">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
};

const UserDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const currentUser = useUserStore((state) => state.user);
  const { theme } = useThemeStore();
  const { isUserOnline, getUserLastSeen, requestUserStatus } = useChatStore();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("about");

  const isOwn = !userId || userId === currentUser?.id;
  const isDark = theme === "dark";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (isOwn) {
        setProfile(currentUser);
        setLoading(false);
        return;
      }
      try {
        const res = await getAllUsers();
        const users = res?.data?.users ?? [];
        const found = users.find((u) => u.id === userId);
        setProfile(found || null);
        if (found?.id) requestUserStatus(found.id);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId, currentUser, isOwn, requestUserStatus]);

  const getStatusText = () => {
    if (!profile?.id) return "";
    const online = isUserOnline(profile.id);
    if (online === true) return "Online";
    const lastSeen = getUserLastSeen(profile.id);
    if (lastSeen) return `Last seen ${formatTimestamp(lastSeen)}`;
    return "Offline";
  };

  const cardClass = `rounded-2xl p-4 ${
    isDark ? "bg-[#202c33]" : "bg-white shadow-sm"
  }`;

  if (loading) {
    return (
      <AppShell title="Profile">
        <div className="p-8 space-y-4 animate-pulse">
          <div className={`w-24 h-24 rounded-full mx-auto ${isDark ? "bg-gray-700" : "bg-gray-200"}`} />
          <div className={`h-4 w-32 mx-auto rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`} />
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell title="Profile">
        <div className="p-8 text-center opacity-60">User not found</div>
      </AppShell>
    );
  }

  const phone = profile.phone
    ? `${profile.phoneSuffix || ""}${profile.phone}`
    : null;

  const tabs = ["about", "media"];

  return (
    <AppShell title={isOwn ? "My Profile" : profile.username}>
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {!isOwn && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100"
          >
            <FaArrowLeft className="w-3 h-3" /> Back
          </button>
        )}

        <div className={`${cardClass} text-center`}>
          <button type="button" onClick={() => setPhotoOpen(true)}>
            <img
              src={profile.profilePicture || "/default-avatar.png"}
              alt={profile.username}
              className="w-28 h-28 rounded-full object-cover mx-auto ring-4 ring-red-500/30"
            />
          </button>
          <h2 className="text-xl font-semibold mt-4">{profile.username}</h2>
          <p className="text-sm opacity-60 mt-1">{getStatusText()}</p>
          {profile.about && (
            <p className="text-sm mt-3 opacity-80">{profile.about}</p>
          )}
          {isOwn && (
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full text-sm hover:bg-red-600 transition"
            >
              <FaEdit className="w-3 h-3" /> Edit profile
            </button>
          )}
        </div>

        <div className={`${cardClass}`}>
          <div className="flex gap-2 mb-2 border-b border-gray-700/30 pb-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-full text-sm capitalize transition ${
                  activeTab === tab
                    ? "bg-red-500 text-white"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "about" && (
            <div className="divide-y divide-gray-700/20">
              <InfoRow icon={FaPhone} label="Phone" value={phone} />
              <InfoRow icon={FaEnvelope} label="Email" value={profile.email} />
              {profile.createdAt && (
                <InfoRow
                  icon={FaUser}
                  label="Joined"
                  value={new Date(profile.createdAt).toLocaleDateString()}
                />
              )}
            </div>
          )}

          {activeTab === "media" && (
            <p className="text-sm opacity-60 py-4 text-center">
              Shared media appears here when available in your chats.
            </p>
          )}
        </div>
      </div>

      {isOwn && (
        <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />
      )}
      <ProfilePictureViewer
        src={profile.profilePicture}
        open={photoOpen}
        onClose={() => setPhotoOpen(false)}
      />
    </AppShell>
  );
};

export default UserDetails;
