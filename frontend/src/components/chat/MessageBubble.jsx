import { FaStar, FaReply, FaTrash } from "react-icons/fa";
import formatTimestamp from "../../utils/formatTime";

const MessageBubble = ({
  message,
  isOwn,
  onReaction,
  onDelete,
  onReply,
  onStar,
  isStarred,
}) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case "SENT": return "✓";
      case "DELIVERED": return "✓✓";
      case "READ": return "✓✓";
      default: return "";
    }
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} group`}>
      <div
        className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-2xl relative ${
          isOwn
            ? "bg-red-500 text-white rounded-br-sm"
            : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm"
        }`}
      >
        {message.replyTo && (
          <div
            className={`text-xs mb-2 pl-2 border-l-2 opacity-80 ${
              isOwn ? "border-white/60" : "border-red-500"
            }`}
          >
            <p className="font-medium">{message.replyTo.sender?.username}</p>
            <p className="truncate">{message.replyTo.content || `[${message.replyTo.contentType}]`}</p>
          </div>
        )}

        {message.contentType === "TEXT" && (
          <p className="wrap-break-word whitespace-pre-wrap">{message.content}</p>
        )}
        {message.contentType === "IMAGE" && message.imageOrVideoUrl && (
          <img src={message.imageOrVideoUrl} alt="shared" className="max-w-full rounded-lg" loading="lazy" />
        )}
        {message.contentType === "VIDEO" && message.imageOrVideoUrl && (
          <video src={message.imageOrVideoUrl} controls className="max-w-full rounded-lg" />
        )}

        <div className="flex items-center justify-end gap-2 mt-1">
          {isStarred && <FaStar className="w-3 h-3 text-yellow-300" />}
          <span className="text-xs opacity-70">{formatTimestamp(message.createdAt)}</span>
          {isOwn && (
            <span className={`text-xs ${message.messageStatus === "READ" ? "font-bold" : "opacity-70"}`}>
              {getStatusIcon(message.messageStatus)}
            </span>
          )}
        </div>

        {message.reactions?.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {message.reactions.map((r) => (
              <button
                key={`${r.userId}-${r.emoji}`}
                type="button"
                onClick={() => onReaction(message.id, r.emoji)}
                className="text-sm bg-white/30 px-2 py-0.5 rounded-full"
              >
                {r.emoji}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={() => onReaction(message.id, "👍")} className="text-xs p-1 hover:scale-110" title="React">👍</button>
          <button type="button" onClick={() => onReply(message)} className="text-xs p-1 opacity-70 hover:opacity-100" title="Reply"><FaReply /></button>
          <button type="button" onClick={() => onStar(message.id)} className="text-xs p-1 opacity-70 hover:opacity-100" title="Star"><FaStar className={isStarred ? "text-yellow-400" : ""} /></button>
          {isOwn && (
            <button type="button" onClick={() => onDelete(message.id)} className="text-xs p-1 text-red-400" title="Delete"><FaTrash /></button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
