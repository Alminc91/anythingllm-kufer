import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";

/**
 * Enterprise feature: Billing cycle settings for workspaces
 * Allows admins to configure:
 * - Cycle start date (when the billing period begins)
 * - Cycle duration (1, 2, 3, 4, 6, or 12 months)
 *
 * These settings work together with messagesLimit to create
 * flexible billing cycles that reset automatically.
 */
export default function CycleSettings({ workspace, setHasChanges }) {
  const { t } = useTranslation();

  // Format date for input (YYYY-MM-DD)
  const formatDateForInput = (dateValue) => {
    if (!dateValue) return "";
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  };

  // Calculate next reset date for display
  const calculateNextReset = (startDate, durationMonths) => {
    if (!startDate || !durationMonths) return null;

    const start = new Date(startDate);
    if (isNaN(start.getTime())) return null;

    const now = new Date();
    let cycleStart = new Date(start);

    // Find current cycle start
    while (addMonths(cycleStart, durationMonths) <= now) {
      cycleStart = addMonths(cycleStart, durationMonths);
    }

    return addMonths(cycleStart, durationMonths);
  };

  // Add months with clamping (same logic as backend)
  const addMonths = (date, months) => {
    const originalDay = date.getDate();
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);

    if (result.getDate() !== originalDay) {
      result.setDate(0);
    }

    return result;
  };

  const [cycleStartDate, setCycleStartDate] = useState(
    formatDateForInput(workspace?.cycleStartDate)
  );
  const [cycleDurationMonths, setCycleDurationMonths] = useState(
    workspace?.cycleDurationMonths || ""
  );

  const nextReset = calculateNextReset(cycleStartDate, cycleDurationMonths);

  const cycleDurationOptions = [
    { value: 1, label: t("1 Monat") },
    { value: 2, label: t("2 Monate") },
    { value: 3, label: t("3 Monate (Quartal)") },
    { value: 4, label: t("4 Monate") },
    { value: 6, label: t("6 Monate (Halbjahr)") },
    { value: 12, label: t("12 Monate (Jahr)") },
  ];

  return (
    <div className="mt-6 pt-6 border-t border-white/10">
      <div className="flex flex-col gap-y-1 mb-4">
        <label className="block mb-2 input-label">
          {t("Abrechnungszyklus")}
        </label>
        <p className="text-white text-opacity-60 text-xs font-medium">
          {t(
            "Enterprise-Feature: Konfigurieren Sie den Abrechnungszyklus für diesen Workspace. Das Nachrichtenlimit wird automatisch zum konfigurierten Zeitpunkt zurückgesetzt."
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cycle Start Date */}
        <div>
          <label
            htmlFor="cycleStartDate"
            className="block mb-2 text-sm font-medium text-white"
          >
            {t("Zyklus-Startdatum")}
          </label>
          <input
            name="cycleStartDate"
            type="date"
            value={cycleStartDate}
            onChange={(e) => {
              setCycleStartDate(e.target.value);
              setHasChanges(true);
            }}
            className="border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5"
          />
          <p className="mt-1 text-xs text-white/40">
            {t("Datum, ab dem der Abrechnungszyklus beginnt")}
          </p>
        </div>

        {/* Cycle Duration */}
        <div>
          <label
            htmlFor="cycleDurationMonths"
            className="block mb-2 text-sm font-medium text-white"
          >
            {t("Zyklus-Dauer")}
          </label>
          <select
            name="cycleDurationMonths"
            value={cycleDurationMonths}
            onChange={(e) => {
              setCycleDurationMonths(e.target.value ? parseInt(e.target.value) : "");
              setHasChanges(true);
            }}
            className="border-none bg-theme-settings-input-bg text-white text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5"
          >
            <option value="">{t("-- Auswählen --")}</option>
            {cycleDurationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-white/40">
            {t("Nach dieser Dauer wird das Kontingent zurückgesetzt")}
          </p>
        </div>
      </div>

      {/* Next Reset Info */}
      {nextReset && (
        <div className="mt-4 p-3 bg-theme-bg-secondary rounded-lg border border-white/10">
          <p className="text-sm text-white">
            <span className="text-white/60">{t("Nächster Reset:")}</span>{" "}
            <span className="font-medium">
              {nextReset.toLocaleDateString("de-DE", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
        <p className="text-xs text-blue-300">
          <strong>{t("Hinweis:")}</strong>{" "}
          {t(
            "Bei einem Upgrade kann das Startdatum auf das aktuelle Datum gesetzt werden, um den Zyklus sofort zurückzusetzen. Das Kontingent beginnt dann neu zu zählen."
          )}
        </p>
      </div>
    </div>
  );
}
