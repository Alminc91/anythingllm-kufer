import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Embed from "@/models/embed";
import ConversationList from "./ConversationList";
import StatisticsGrid from "./StatisticsGrid";
import showToast from "@/utils/toast";

export default function EmbedAnalyticsView() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEmbed, setSelectedEmbed] = useState(null);
  const [embeds, setEmbeds] = useState([]);
  const [dateRange, setDateRange] = useState("week"); // "week", "month", "all"
  const [retentionDays, setRetentionDays] = useState(null);

  useEffect(() => {
    async function loadEmbeds() {
      const embedsData = await Embed.embeds();
      setEmbeds(embedsData || []);
      if (embedsData?.length > 0) {
        setSelectedEmbed(embedsData[0].id);
        // Retention Days vom ersten Embed setzen
        setRetentionDays(embedsData[0].chat_retention_days || null);
      }
    }
    loadEmbeds();
  }, []);

  useEffect(() => {
    if (!selectedEmbed) return;

    // Retention Days vom ausgewählten Embed aktualisieren
    const currentEmbed = embeds.find(e => e.id === selectedEmbed);
    setRetentionDays(currentEmbed?.chat_retention_days || null);

    async function loadStats() {
      setLoading(true);
      const { startDate, endDate } = getDateRange(dateRange);
      const { success, stats: data } = await Embed.getAnalyticsOverview(
        selectedEmbed,
        startDate,
        endDate
      );

      if (success) {
        setStats(data);
      } else {
        showToast(t("embed-analytics.load-error"), "error");
      }
      setLoading(false);
    }
    loadStats();
  }, [selectedEmbed, dateRange, embeds, t]);

  const getDateRange = (range) => {
    const now = new Date();
    let endDate = now.toISOString();
    let startDate;

    switch (range) {
      case "week":
        startDate = new Date(
          now.getTime() - 7 * 24 * 60 * 60 * 1000
        ).toISOString();
        break;
      case "month":
        startDate = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        ).toISOString();
        break;
      case "all":
      default:
        startDate = null;
        endDate = null;
    }

    return { startDate, endDate };
  };

  if (loading || !stats) {
    return <div className="p-6 text-white">{t("common.loading")}</div>;
  }

  return (
    <div className="flex-1 flex-col p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-white text-2xl font-bold">
          {t("embed-analytics.title")}
        </h2>

        <div className="flex gap-3">
          {/* Embed Selector */}
          <select
            value={selectedEmbed || ""}
            onChange={(e) => setSelectedEmbed(Number(e.target.value))}
            className="bg-theme-settings-input-bg text-white rounded-lg px-4 py-2 text-sm border border-white/10 focus:border-white/20 transition-all"
          >
            {embeds.map((embed) => (
              <option key={embed.id} value={embed.id}>
                Embed #{embed.id} ({embed.workspace?.name})
              </option>
            ))}
          </select>

          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-theme-settings-input-bg text-white rounded-lg px-4 py-2 text-sm border border-white/10 focus:border-white/20 transition-all"
          >
            <option value="week">{t("embed-analytics.last-week")}</option>
            <option value="month">{t("embed-analytics.last-month")}</option>
            <option value="all">{t("embed-analytics.all-time")}</option>
          </select>
        </div>
      </div>

      {/* DSGVO Retention Notice - Nur anzeigen wenn gesetzt */}
      {retentionDays && retentionDays > 0 && (() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays + 1);
        cutoffDate.setHours(0, 0, 0, 0);

        const formatDate = (date) => {
          return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        };

        return (
          <div className="mb-6 p-4 bg-blue-500/10 border-l-4 border-blue-400 rounded-lg light:bg-blue-50 light:border-blue-600">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400 light:text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-blue-300 text-sm light:text-blue-700">
                {t("embed-analytics.retention-notice", {
                  nextCleanup: formatDate(tomorrow),
                  cutoffDate: formatDate(cutoffDate)
                })}
              </span>
            </div>
          </div>
        );
      })()}

      {/* Statistics Grid */}
      <StatisticsGrid stats={stats} />

      {/* Divider */}
      <div className="h-px bg-white/20 my-8" />

      {/* Conversations List */}
      <ConversationList
        embedId={selectedEmbed}
        dateRange={dateRange}
        getDateRange={getDateRange}
      />
    </div>
  );
}
