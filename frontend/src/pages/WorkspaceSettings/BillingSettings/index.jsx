import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import useUser from "@/hooks/useUser";
import System from "@/models/system";
import BillingAdminView from "./BillingAdminView";
import BillingCustomerView from "./BillingCustomerView";

/**
 * Billing Settings Tab
 *
 * Shows different views based on user role:
 * - Admin: Full write access to billing configuration
 * - Customer: Read-only view with usage stats and progress bar
 */
export default function BillingSettings({ workspace }) {
  const { t } = useTranslation();
  const { user } = useUser();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      const _settings = await System.keys();
      setSettings(_settings ?? {});
      setLoading(false);
    }
    fetchSettings();
  }, []);

  // Determine if user is a customer (default role in multi-user mode)
  // - Single-user mode: Always show admin view
  // - Multi-user mode with admin/manager: Show admin view
  // - Multi-user mode with default role: Show customer view (read-only)
  const isMultiUserMode = settings?.MultiUserMode === true;
  const isCustomer = isMultiUserMode && user?.role === "default";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-white/60">
          {t("Lade Abrechnungsdaten...")}
        </div>
      </div>
    );
  }

  if (!workspace) return null;

  // Show customer view for default users, admin view for everyone else
  return isCustomer ? (
    <BillingCustomerView workspace={workspace} />
  ) : (
    <BillingAdminView workspace={workspace} />
  );
}
