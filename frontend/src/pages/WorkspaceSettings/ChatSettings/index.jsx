import System from "@/models/system";
import Workspace from "@/models/workspace";
import showToast from "@/utils/toast";
import { castToType } from "@/utils/types";
import { useEffect, useRef, useState } from "react";
import ChatHistorySettings from "./ChatHistorySettings";
import ChatMessagesLimitSettings from "./ChatMessagesLimitSettings";
import ChatPromptSettings from "./ChatPromptSettings";
import ChatTemperatureSettings from "./ChatTemperatureSettings";
import ChatModeSelection from "./ChatModeSelection";
import WorkspaceLLMSelection from "./WorkspaceLLMSelection";
import ChatQueryRefusalResponse from "./ChatQueryRefusalResponse";
import CycleSettings from "./CycleSettings";
import CTAButton from "@/components/lib/CTAButton";
import useUser from "@/hooks/useUser";

export default function ChatSettings({ workspace }) {
  const { user } = useUser();
  const [settings, setSettings] = useState({});

  // Only admin can modify messagesLimit (billing protection)
  // In single-user mode (no multi_user_mode), treat user as admin
  const isMultiUserMode = settings?.multi_user_mode;
  const isAdmin = !isMultiUserMode || user?.role === "admin";
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const formEl = useRef(null);
  useEffect(() => {
    async function fetchSettings() {
      const _settings = await System.keys();
      setSettings(_settings ?? {});
    }
    fetchSettings();
  }, []);

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
      showToast("Workspace updated!", "success", { clear: true });
      setHasChanges(false);
    } else {
      showToast(`Error: ${message}`, "error", { clear: true });
      // Keep hasChanges true on error so user can retry
    }
    setSaving(false);
  };

  if (!workspace) return null;
  return (
    <div id="workspace-chat-settings-container" className="relative">
      <form
        ref={formEl}
        onSubmit={handleUpdate}
        id="chat-settings-form"
        className="w-1/2 flex flex-col gap-y-6"
      >
        {hasChanges && (
          <div className="absolute top-0 right-0">
            <CTAButton type="submit">
              {saving ? "Updating..." : "Update Workspace"}
            </CTAButton>
          </div>
        )}
        <WorkspaceLLMSelection
          settings={settings}
          workspace={workspace}
          setHasChanges={setHasChanges}
        />
        <ChatModeSelection
          workspace={workspace}
          setHasChanges={setHasChanges}
        />
        <ChatHistorySettings
          workspace={workspace}
          setHasChanges={setHasChanges}
        />
        {isAdmin && (
          <ChatMessagesLimitSettings
            workspace={workspace}
            setHasChanges={setHasChanges}
          />
        )}
        {isAdmin && (
          <CycleSettings
            workspace={workspace}
            setHasChanges={setHasChanges}
          />
        )}
        <ChatPromptSettings
          workspace={workspace}
          setHasChanges={setHasChanges}
          hasChanges={hasChanges}
        />
        <ChatQueryRefusalResponse
          workspace={workspace}
          setHasChanges={setHasChanges}
        />
        <ChatTemperatureSettings
          settings={settings}
          workspace={workspace}
          setHasChanges={setHasChanges}
        />
      </form>
    </div>
  );
}
