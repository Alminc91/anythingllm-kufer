import { useEffect, useState, useRef } from "react";
import * as Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import useQuery from "@/hooks/useQuery";
import ChatRow from "./ChatRow";
import Embed from "@/models/embed";
import { useTranslation } from "react-i18next";
import { CaretDown, Download, Trash, CaretUp } from "@phosphor-icons/react";
import showToast from "@/utils/toast";
import { saveAs } from "file-saver";
import System from "@/models/system";
import useUser from "@/hooks/useUser";
import { formatDateTimeDE } from "@/utils/directories";
import { safeJsonParse } from "@/utils/request";

const exportOptions = {
  csv: {
    name: "CSV",
    mimeType: "text/csv",
    fileExtension: "csv",
    filenameFunc: () => {
      return `anythingllm-embed-chats-${new Date().toLocaleDateString()}`;
    },
  },
  json: {
    name: "JSON",
    mimeType: "application/json",
    fileExtension: "json",
    filenameFunc: () => {
      return `anythingllm-embed-chats-${new Date().toLocaleDateString()}`;
    },
  },
  jsonl: {
    name: "JSONL",
    mimeType: "application/jsonl",
    fileExtension: "jsonl",
    filenameFunc: () => {
      return `anythingllm-embed-chats-${new Date().toLocaleDateString()}-lines`;
    },
  },
  jsonAlpaca: {
    name: "JSON (Alpaca)",
    mimeType: "application/json",
    fileExtension: "json",
    filenameFunc: () => {
      return `anythingllm-embed-chats-${new Date().toLocaleDateString()}-alpaca`;
    },
  },
};

export default function EmbedChatsView() {
  const { t } = useTranslation();
  const { user } = useUser();
  const menuRef = useRef();
  const query = useQuery();
  const openMenuButton = useRef();
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState([]);
  const [offset, setOffset] = useState(Number(query.get("offset") || 0));
  const [canNext, setCanNext] = useState(false);
  const isReadOnly = user?.role === "default";
  const [retentionInfo, setRetentionInfo] = useState({});

  const handleDumpChats = async (exportType) => {
    const chats = await System.exportChats(exportType, "embed");
    if (!!chats) {
      const { name, mimeType, fileExtension, filenameFunc } =
        exportOptions[exportType];
      const blob = new Blob([chats], { type: mimeType });
      saveAs(blob, `${filenameFunc()}.${fileExtension}`);
      showToast(`Embed chats exported successfully as ${name}.`, "success");
    } else {
      showToast("Failed to export embed chats.", "error");
    }
  };

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !openMenuButton.current.contains(event.target)
      ) {
        setShowMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    async function loadEmbedConfigs() {
      const embeds = await Embed.embeds();
      if (embeds && embeds.length > 0) {
        const retentionMap = {};
        embeds.forEach(e => {
          if (e.chat_retention_days && e.chat_retention_days > 0) {
            retentionMap[e.id] = {
              days: e.chat_retention_days,
              workspace: e.workspace?.name || `Embed #${e.id}`
            };
          }
        });
        setRetentionInfo(retentionMap);
      }
    }
    loadEmbedConfigs();
  }, []);

  useEffect(() => {
    async function fetchConversations() {
      setLoading(true);
      await Embed.getConversationsGlobal(offset, 20)
        .then(({ conversations = [], hasMore = false }) => {
          setChats(conversations);
          setCanNext(hasMore);
        })
        .finally(() => {
          setLoading(false);
        });
    }
    fetchConversations();
  }, [offset]);

  const handlePrevious = () => {
    setOffset(Math.max(offset - 1, 0));
  };

  const handleNext = () => {
    setOffset(offset + 1);
  };

  const handleDeleteChat = (chatId) => {
    setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));
  };

  const handleClearAllChats = async () => {
    if (
      !window.confirm(
        t("embed-chats.clear-all-confirm")
      )
    )
      return;

    const { success, deletedCount } = await Embed.clearAllChats();
    if (success) {
      showToast(
        t("embed-chats.clear-all-success", { count: deletedCount }),
        "success"
      );
      setChats([]);
      setOffset(0);
    } else {
      showToast(t("embed-chats.clear-all-error"), "error");
    }
  };

  if (loading) {
    return (
      <Skeleton.default
        height="80vh"
        width="100%"
        highlightColor="var(--theme-bg-primary)"
        baseColor="var(--theme-bg-secondary)"
        count={1}
        className="w-full p-4 rounded-b-2xl rounded-tr-2xl rounded-tl-sm"
        containerClassName="flex w-full"
      />
    );
  }

  return (
    <div className="flex flex-col w-full p-4 overflow-none">
      <div className="w-full flex flex-col gap-y-1">
        <div className="flex flex-wrap gap-4 items-center">
          <p className="text-lg leading-6 font-bold text-theme-text-primary">
            {t("embed-chats.title")}
          </p>
          <div className="relative">
            <button
              ref={openMenuButton}
              onClick={toggleMenu}
              className="flex items-center gap-x-2 px-4 py-1 rounded-lg text-theme-bg-chat bg-primary-button hover:bg-secondary hover:text-white text-xs font-semibold h-[34px] w-fit"
            >
              <Download size={18} weight="bold" />
              {t("embed-chats.export")}
              <CaretDown size={18} weight="bold" />
            </button>
            <div
              ref={menuRef}
              className={`${
                showMenu ? "slide-down" : "slide-up hidden"
              } z-20 w-fit rounded-lg absolute top-full right-0 bg-secondary light:bg-theme-bg-secondary mt-2 shadow-md`}
            >
              <div className="py-2">
                {Object.entries(exportOptions).map(([key, data]) => (
                  <button
                    key={key}
                    onClick={() => {
                      handleDumpChats(key);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-white text-sm hover:bg-[#3D4147] light:hover:bg-theme-sidebar-item-hover"
                  >
                    {data.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {!isReadOnly && (
            <button
              onClick={handleClearAllChats}
              className="flex items-center gap-x-2 px-4 py-1 rounded-lg border border-red-400 text-red-400 hover:border-transparent hover:text-white text-xs font-semibold hover:bg-red-500 h-[34px] w-fit transition-all duration-200"
            >
              <Trash size={18} weight="bold" />
              {t("embed-chats.clear-all")}
            </button>
          )}
        </div>
        <p className="text-xs leading-[18px] font-base text-theme-text-secondary mt-2">
          {t("embed-chats.description")}
        </p>
      </div>

      {/* DSGVO Retention Notice - Gruppiert nach Embed */}
      {Object.keys(retentionInfo).length > 0 && (() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const formatDate = (date) => {
          return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        };

        return (
          <div className="mb-4 mt-6 p-4 bg-blue-500/10 border-l-4 border-blue-400 rounded-lg light:bg-blue-50 light:border-blue-600">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-400 light:text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-blue-300 text-sm light:text-blue-700 space-y-1.5 flex-1">
                <p className="font-medium">
                  {t("embed-chats.retention-header", { date: formatDate(tomorrow) })}
                </p>
                <div className="space-y-0.5 text-xs">
                  {Object.entries(retentionInfo).map(([embedId, info]) => {
                    const cutoffDate = new Date();
                    cutoffDate.setDate(cutoffDate.getDate() - info.days + 1);
                    cutoffDate.setHours(0, 0, 0, 0);

                    return (
                      <p key={embedId}>
                        • {info.workspace}: {t("embed-chats.cutoff-date", { date: formatDate(cutoffDate) })}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="mt-6">
        <div className="space-y-4">
          {chats.length === 0 ? (
            <div className="text-center py-12 text-theme-text-secondary">
              <p>{t("embed-chats.no-conversations")}</p>
            </div>
          ) : (
            chats.map((conversation) => (
              <ConversationCard
                key={conversation.conversation_id}
                conversation={conversation}
                isReadOnly={isReadOnly}
              />
            ))
          )}
        </div>
        {(offset > 0 || canNext) && (
          <div className="flex items-center justify-end gap-2 mt-6 pb-6">
            <button
              onClick={handlePrevious}
              disabled={offset === 0}
              className={`px-4 py-2 text-sm rounded-lg ${
                offset === 0
                  ? "bg-theme-bg-secondary text-theme-text-disabled cursor-not-allowed"
                  : "bg-theme-bg-secondary text-theme-text-primary hover:bg-theme-hover"
              }`}
            >
              {t("common.previous")}
            </button>
            <button
              onClick={handleNext}
              disabled={!canNext}
              className={`px-4 py-2 text-sm rounded-lg ${
                !canNext
                  ? "bg-theme-bg-secondary text-theme-text-disabled cursor-not-allowed"
                  : "bg-theme-bg-secondary text-theme-text-primary hover:bg-theme-hover"
              }`}
            >
              {t("common.next")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function: Time ago in German (e.g., "vor 2 Stunden")
function timeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "vor wenigen Sekunden";
  if (minutes < 60) return `vor ${minutes} ${minutes === 1 ? "Minute" : "Minuten"}`;
  if (hours < 24) return `vor ${hours} ${hours === 1 ? "Stunde" : "Stunden"}`;
  if (days < 30) return `vor ${days} ${days === 1 ? "Tag" : "Tagen"}`;

  const months = Math.floor(days / 30);
  if (months < 12) return `vor ${months} ${months === 1 ? "Monat" : "Monaten"}`;

  const years = Math.floor(months / 12);
  return `vor ${years} ${years === 1 ? "Jahr" : "Jahren"}`;
}

// Conversation Card Component
function ConversationCard({ conversation, isReadOnly }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const isNew = Date.now() - conversation.last_message_at < 60 * 60 * 1000; // <1h

  const loadMessages = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }

    setExpanded(true);
    setLoadingMessages(true);

    try {
      const result = await Embed.getConversationDetails(
        conversation.embed_id,
        conversation.conversation_id
      );
      if (result.success && result.messages) {
        setMessages(result.messages);
      }
    } catch (error) {
      console.error("Failed to load conversation messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  return (
    <div className="border border-white/10 rounded-lg bg-theme-bg-primary hover:border-white/20 transition-all">
      {/* Header */}
      <div
        className="p-4 cursor-pointer"
        onClick={loadMessages}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {/* Workspace Name */}
              <h3 className="text-sm font-semibold text-white truncate">
                {conversation.workspace || `Embed #${conversation.embed_id}`}
              </h3>
              {/* NEW Badge */}
              {isNew && (
                <span className="px-2 py-0.5 text-xs font-bold bg-green-500/20 text-green-400 rounded border border-green-500/30">
                  🆕 NEU
                </span>
              )}
            </div>

            {/* Preview */}
            <p className="text-xs text-theme-text-secondary mb-3 line-clamp-2">
              {conversation.preview || "Keine Vorschau verfügbar"}
            </p>

            {/* Metadata */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-theme-text-secondary">
              <span>
                Erstellt: {formatDateTimeDE(conversation.started_at)}
              </span>
              <span>•</span>
              <span>
                Letzte Nachricht: {timeAgo(conversation.last_message_at)}
              </span>
              <span>•</span>
              <span>
                {conversation.message_count} {conversation.message_count === 1 ? "Nachricht" : "Nachrichten"}
              </span>
            </div>
          </div>

          {/* Expand Icon */}
          <div className="flex-shrink-0">
            {expanded ? (
              <CaretUp size={20} className="text-theme-text-secondary" />
            ) : (
              <CaretDown size={20} className="text-theme-text-secondary" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Messages */}
      {expanded && (
        <div className="border-t border-white/10 p-4 bg-theme-bg-secondary">
          {loadingMessages ? (
            <div className="text-center py-4 text-theme-text-secondary text-sm">
              Lade Nachrichten...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-4 text-theme-text-secondary text-sm">
              Keine Nachrichten gefunden
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, idx) => (
                <div key={msg.id || idx} className="border-l-2 border-blue-500/30 pl-3">
                  <div className="text-xs text-theme-text-secondary mb-1">
                    {formatDateTimeDE(msg.createdAt)}
                  </div>
                  <div className="text-sm text-white mb-1">
                    <strong>User:</strong> {msg.prompt}
                  </div>
                  <div className="text-sm text-theme-text-secondary">
                    <strong>AI:</strong> {safeJsonParse(msg.response, {})?.text || msg.response || 'Keine Antwort'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
