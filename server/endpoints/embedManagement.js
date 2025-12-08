const { EmbedChats } = require("../models/embedChats");
const { EmbedConfig } = require("../models/embedConfig");
const { EventLogs } = require("../models/eventLogs");
const { WorkspaceUser } = require("../models/workspaceUsers");
const { reqBody, userFromSession } = require("../utils/http");
const { validEmbedConfigId } = require("../utils/middleware/embedMiddleware");
const {
  flexUserRoleValid,
  ROLES,
} = require("../utils/middleware/multiUserProtected");
const { validatedRequest } = require("../utils/middleware/validatedRequest");
const {
  chatHistoryViewable,
} = require("../utils/middleware/chatHistoryViewable");

function embedManagementEndpoints(app) {
  if (!app) return;

  app.get(
    "/embeds",
    [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager, ROLES.default])],
    async (request, response) => {
      try {
        const user = await userFromSession(request, response);
        let embeds;

        // Default users only see embeds for their assigned workspaces
        if (user?.role === ROLES.default) {
          const userWorkspaces = await WorkspaceUser.where({ user_id: user.id });
          const workspaceIds = userWorkspaces.map(ws => ws.workspace_id);
          if (workspaceIds.length === 0) {
            return response.status(200).json({ embeds: [] });
          }
          embeds = await EmbedConfig.whereWithWorkspace(
            { workspace_id: { in: workspaceIds } },
            null,
            { createdAt: "desc" }
          );
        } else {
          embeds = await EmbedConfig.whereWithWorkspace({}, null, {
            createdAt: "desc",
          });
        }

        response.status(200).json({ embeds });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );

  app.post(
    "/embeds/new",
    [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager, ROLES.default])],
    async (request, response) => {
      try {
        const user = await userFromSession(request, response);
        const data = reqBody(request);
        const { embed, message: error } = await EmbedConfig.new(data, user?.id);
        await EventLogs.logEvent(
          "embed_created",
          { embedId: embed.id },
          user?.id
        );
        response.status(200).json({ embed, error });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );

  app.post(
    "/embed/update/:embedId",
    [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager, ROLES.default]), validEmbedConfigId],
    async (request, response) => {
      try {
        const user = await userFromSession(request, response);
        const { embedId } = request.params;
        const updates = reqBody(request);
        const { success, error } = await EmbedConfig.update(embedId, updates);
        await EventLogs.logEvent("embed_updated", { embedId }, user?.id);
        response.status(200).json({ success, error });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );

  app.delete(
    "/embed/:embedId",
    [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager, ROLES.default]), validEmbedConfigId],
    async (request, response) => {
      try {
        const { embedId } = request.params;
        await EmbedConfig.delete({ id: Number(embedId) });
        await EventLogs.logEvent(
          "embed_deleted",
          { embedId },
          response?.locals?.user?.id
        );
        response.status(200).json({ success: true, error: null });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );

  app.post(
    "/embed/chats",
    [chatHistoryViewable, validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager, ROLES.default])],
    async (request, response) => {
      try {
        const user = await userFromSession(request, response);
        const { offset = 0, limit = 20 } = reqBody(request);
        let embedChats;
        let totalChats;

        // Default users only see chats for embeds in their assigned workspaces
        if (user?.role === ROLES.default) {
          const userWorkspaces = await WorkspaceUser.where({ user_id: user.id });
          const workspaceIds = userWorkspaces.map(ws => ws.workspace_id);
          if (workspaceIds.length === 0) {
            return response.status(200).json({ chats: [], hasPages: false, totalChats: 0 });
          }
          embedChats = await EmbedChats.whereWithEmbedAndWorkspace(
            { embed_config: { workspace_id: { in: workspaceIds } } },
            limit,
            { id: "desc" },
            offset * limit
          );
          totalChats = await EmbedChats.count({ embed_config: { workspace_id: { in: workspaceIds } } });
        } else {
          embedChats = await EmbedChats.whereWithEmbedAndWorkspace(
            {},
            limit,
            { id: "desc" },
            offset * limit
          );
          totalChats = await EmbedChats.count();
        }

        const hasPages = totalChats > (offset + 1) * limit;
        response.status(200).json({ chats: embedChats, hasPages, totalChats });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );

  app.delete(
    "/embed/chats/:chatId",
    [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager, ROLES.default])],
    async (request, response) => {
      try {
        const { chatId } = request.params;
        await EmbedChats.delete({ id: Number(chatId) });
        response.status(200).json({ success: true, error: null });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );
}

module.exports = { embedManagementEndpoints };
