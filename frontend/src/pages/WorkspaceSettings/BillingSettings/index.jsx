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

  // Determine if user has admin privileges
  // In single-user mode (no multi_user_mode), treat user as admin
  const isMultiUserMode = settings?.multi_user_mode;
  const isAdmin = !isMultiUserMode || user?.role === "admin";

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

  // Show admin view for admins, customer view for regular users
  return isAdmin ? (
    <BillingAdminView workspace={workspace} />
  ) : (
    <BillingCustomerView workspace={workspace} />
  );
}
