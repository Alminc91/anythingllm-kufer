import { useTranslation } from "react-i18next";

export default function StatisticsGrid({ stats }) {
  const { t } = useTranslation();

  const statCards = [
    {
      label: t("embed-analytics.stats.total-chats"),
      value: stats.total_chats,
      color: "#0068b3",
    },
    {
      label: t("embed-analytics.stats.conversations"),
      value: stats.unique_sessions,
      color: "#0068b3",
    },
    {
      label: t("embed-analytics.stats.words-prompt"),
      value: stats.total_words_prompt.toLocaleString("de-DE"),
      color: "#0068b3",
    },
    {
      label: t("embed-analytics.stats.avg-per-conv"),
      value: stats.avg_chats_per_conversation.toFixed(1),
      color: "#0068b3",
    },
  ];

  return (
    <div>
      <h3 className="text-white text-xl mb-4">
        {t("embed-analytics.statistics-title")}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white/5 border-2 border-white/10 rounded-lg p-4 hover:border-white/20 transition-all"
          >
            <h4 className="text-white/60 text-sm mb-2">{stat.label}</h4>
            <p className="text-3xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
