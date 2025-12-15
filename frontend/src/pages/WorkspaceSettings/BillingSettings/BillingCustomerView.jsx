import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Workspace from "@/models/workspace";

/**
 * Customer View for Billing Settings
 * Read-only view showing usage statistics and progress bar
 */
export default function BillingCustomerView({ workspace }) {
  const { t } = useTranslation();
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUsageData() {
      try {
        const data = await Workspace.getUsageInfo(workspace.slug);
        setUsageData(data);
      } catch (err) {
        console.error("Failed to fetch usage data:", err);
        setError(t("Nutzungsdaten konnten nicht geladen werden."));
      }
      setLoading(false);
    }
    fetchUsageData();
  }, [workspace.slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-white/60">
          {t("Lade Nutzungsdaten...")}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 rounded-xl border border-red-500/20">
        <p className="text-red-300">{error}</p>
      </div>
    );
  }

  // Extract data
  const messageCount = usageData?.messageCount ?? 0;
  const messagesLimit = usageData?.messagesLimit;
  const cycleInfo = usageData?.cycleInfo;
  const isUnlimited = messagesLimit === null || messagesLimit === undefined;

  // Calculate percentage
  const percentage = isUnlimited ? 0 : Math.min((messageCount / messagesLimit) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  // Format next reset date
  const formatNextReset = () => {
    if (cycleInfo?.nextReset) {
      return new Date(cycleInfo.nextReset).toLocaleDateString("de-DE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    // Fallback to next month
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toLocaleDateString("de-DE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Get days remaining
  const daysRemaining = cycleInfo?.daysRemaining ?? (() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return lastDay.getDate() - now.getDate();
  })();

  // Get cycle period text
  const getCyclePeriodText = () => {
    if (!cycleInfo?.cycleDurationMonths) return t("Monat");
    switch (cycleInfo.cycleDurationMonths) {
      case 1: return t("Monat");
      case 2: return t("2-Monatszyklus");
      case 3: return t("Quartal");
      case 4: return t("4-Monatszyklus");
      case 6: return t("Halbjahr");
      case 12: return t("Jahr");
      default: return t("Zyklus");
    }
  };

  // Progress bar color based on usage
  const getProgressColor = () => {
    if (isAtLimit) return "bg-red-500";
    if (isNearLimit) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="w-full max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">
          {t("Ihr Kontingent")}
        </h2>
        <p className="text-white/60 text-sm mt-1">
          {t("Ubersicht uber Ihre Nutzung in diesem Workspace.")}
        </p>
      </div>

      {/* Main Usage Card */}
      <div className="bg-theme-bg-primary rounded-xl p-6 mb-6">
        {isUnlimited ? (
          /* Unlimited usage */
          <div className="text-center py-8">
            <div className="text-4xl mb-2">{"\u221E"}</div>
            <p className="text-xl font-semibold text-white">
              {t("Unbegrenztes Kontingent")}
            </p>
            <p className="text-white/60 text-sm mt-2">
              {t("Sie konnen diesen Workspace ohne Einschrankungen nutzen.")}
            </p>
          </div>
        ) : (
          /* Limited usage with progress bar */
          <>
            {/* Usage Numbers */}
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-white/60 text-sm">{t("Verbraucht")}</p>
                <p className="text-3xl font-bold text-white">
                  {messageCount.toLocaleString("de-DE")}
                  <span className="text-lg font-normal text-white/60">
                    {" / "}{messagesLimit.toLocaleString("de-DE")}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-sm">{t("Verbleibend")}</p>
                <p className="text-2xl font-semibold text-white">
                  {Math.max(0, messagesLimit - messageCount).toLocaleString("de-DE")}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-theme-bg-secondary rounded-full h-4 mb-4 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getProgressColor()}`}
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* Percentage */}
            <div className="flex justify-between text-sm">
              <span className={`font-medium ${isAtLimit ? "text-red-400" : isNearLimit ? "text-yellow-400" : "text-white/60"}`}>
                {percentage.toFixed(1)}% {t("genutzt")}
              </span>
              <span className="text-white/60">
                {t("pro")} {getCyclePeriodText()}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Cycle Info Card */}
      <div className="bg-theme-bg-primary rounded-xl p-6 mb-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Next Reset */}
          <div>
            <p className="text-white/60 text-sm mb-1">{t("Nachster Reset")}</p>
            <p className="text-lg font-semibold text-white">
              {formatNextReset()}
            </p>
          </div>

          {/* Days Remaining */}
          <div>
            <p className="text-white/60 text-sm mb-1">{t("Verbleibende Tage")}</p>
            <p className="text-lg font-semibold text-white">
              {daysRemaining} {daysRemaining === 1 ? t("Tag") : t("Tage")}
            </p>
          </div>
        </div>
      </div>

      {/* Warning when near or at limit */}
      {!isUnlimited && isNearLimit && (
        <div className={`p-4 rounded-xl border ${
          isAtLimit
            ? "bg-red-500/10 border-red-500/20"
            : "bg-yellow-500/10 border-yellow-500/20"
        }`}>
          {isAtLimit ? (
            <>
              <p className="font-semibold text-red-300 mb-1">
                {t("Kontingent erschopft")}
              </p>
              <p className="text-sm text-red-300/80">
                {t("Sie haben Ihr Nachrichtenlimit fur diesen Zeitraum erreicht. Ihr Kontingent wird am")} {formatNextReset()} {t("erneuert.")}
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-yellow-300 mb-1">
                {t("Kontingent fast erschopft")}
              </p>
              <p className="text-sm text-yellow-300/80">
                {t("Sie haben bereits")} {percentage.toFixed(0)}% {t("Ihres Kontingents verbraucht. Es verbleiben noch")} {Math.max(0, messagesLimit - messageCount).toLocaleString("de-DE")} {t("Nachrichten bis zum")} {formatNextReset()}.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
