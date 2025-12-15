import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Workspace from "@/models/workspace";
import showToast from "@/utils/toast";
import { castToType } from "@/utils/types";
import CTAButton from "@/components/lib/CTAButton";

/**
 * Admin View for Billing Settings
 * Allows admins to configure message limits and billing cycles
 */
export default function BillingAdminView({ workspace }) {
  const { t } = useTranslation();
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const formEl = useRef(null);

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

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = {};
    const form = new FormData(formEl.current);
    for (var [key, value] of form.entries()) data[key] = castToType(key, value);

    const { workspace: updatedWorkspace, message } = await Workspace.update(
      workspace.slug,
      data
    );
    if (updatedWorkspace) {
      showToast("Abrechnungseinstellungen aktualisiert!", "success", { clear: true });
      setHasChanges(false);
    } else {
      showToast(`Fehler: ${message}`, "error", { clear: true });
    }
    setSaving(false);
  };

  return (
    <div className="relative">
      <form ref={formEl} onSubmit={handleUpdate} className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {t("Abrechnung")}
            </h2>
            <p className="text-white/60 text-sm mt-1">
              {t("Konfigurieren Sie Nachrichtenlimits und Abrechnungszyklen für diesen Workspace.")}
            </p>
          </div>
          {hasChanges && (
            <CTAButton type="submit" disabled={saving}>
              {saving ? t("Speichern...") : t("Speichern")}
            </CTAButton>
          )}
        </div>

        {/* Messages Limit Section */}
        <div className="bg-theme-bg-primary rounded-xl p-6 mb-6">
          <div className="flex flex-col gap-y-1 mb-4">
            <label htmlFor="messagesLimit" className="block text-sm font-medium text-white">
              {t("Nachrichtenlimit")}
            </label>
            <p className="text-white/60 text-xs">
              {t("Maximale Anzahl an Nachrichten pro Abrechnungszyklus. Leer lassen für unbegrenzt.")}
            </p>
          </div>
          <input
            name="messagesLimit"
            type="number"
            min={0}
            step={1}
            onWheel={(e) => e.target.blur()}
            defaultValue={workspace?.messagesLimit ?? ""}
            className="border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5"
            placeholder={t("Unbegrenzt")}
            autoComplete="off"
            onChange={() => setHasChanges(true)}
          />
        </div>

        {/* Billing Cycle Section */}
        <div className="bg-theme-bg-primary rounded-xl p-6 mb-6">
          <div className="flex flex-col gap-y-1 mb-4">
            <label className="block text-sm font-medium text-white">
              {t("Abrechnungszyklus")}
            </label>
            <p className="text-white/60 text-xs">
              {t("Enterprise-Feature: Das Kontingent wird automatisch zum konfigurierten Zeitpunkt zuruckgesetzt.")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cycle Start Date */}
            <div>
              <label
                htmlFor="cycleStartDate"
                className="block mb-2 text-sm font-medium text-white/80"
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
                {t("Ab diesem Datum beginnt der Abrechnungszyklus")}
              </p>
            </div>

            {/* Cycle Duration */}
            <div>
              <label
                htmlFor="cycleDurationMonths"
                className="block mb-2 text-sm font-medium text-white/80"
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
                <option value="">{t("-- Auswahlen --")}</option>
                {cycleDurationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-white/40">
                {t("Nach dieser Dauer wird das Kontingent zuruckgesetzt")}
              </p>
            </div>
          </div>

          {/* Next Reset Info */}
          {nextReset && (
            <div className="mt-4 p-3 bg-theme-bg-secondary rounded-lg border border-white/10">
              <p className="text-sm text-white">
                <span className="text-white/60">{t("Nachster Reset:")}</span>{" "}
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
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
          <p className="text-sm text-blue-300">
            <strong>{t("Hinweis:")}</strong>{" "}
            {t("Bei einem Upgrade kann das Startdatum auf das aktuelle Datum gesetzt werden, um den Zyklus sofort zuruckzusetzen. Das Kontingent beginnt dann neu zu zahlen.")}
          </p>
        </div>
      </form>
    </div>
  );
}
