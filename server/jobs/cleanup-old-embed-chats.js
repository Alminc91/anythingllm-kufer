const { log, conclude } = require("./helpers/index.js");
const { EmbedConfig } = require("../models/embedConfig.js");
const { EmbedChats } = require("../models/embedChats.js");
const { EventLogs } = require("../models/eventLogs.js");

/**
 * DSGVO-compliant automatic deletion of old embed chats based on retention periods.
 * Runs daily to clean up chats older than their configured retention days.
 */
(async () => {
  try {
    log("Starting cleanup of old embed chats...");

    // Find all embeds with a retention policy configured
    const embedsWithRetention = await EmbedConfig.where({
      chat_retention_days: { not: null },
    });

    if (embedsWithRetention.length === 0) {
      log("No embeds with retention policies found - exiting.");
      return;
    }

    log(
      `Found ${embedsWithRetention.length} embed(s) with retention policies configured`
    );

    let totalDeleted = 0;

    for (const embed of embedsWithRetention) {
      try {
        const retentionDays = embed.chat_retention_days;
        if (!retentionDays || retentionDays <= 0) continue;

        // Calculate cutoff date: now - retention_days
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        log(
          `Processing embed ${embed.id}: deleting chats older than ${retentionDays} days (before ${cutoffDate.toISOString()})`
        );

        // Count chats to be deleted
        const count = await EmbedChats.count({
          embed_id: embed.id,
          createdAt: { lt: cutoffDate },
        });

        if (count === 0) {
          log(`  No old chats found for embed ${embed.id}`);
          continue;
        }

        // Delete old chats
        await EmbedChats.delete({
          embed_id: embed.id,
          createdAt: { lt: cutoffDate },
        });

        totalDeleted += count;

        log(
          `  Deleted ${count} chat(s) from embed ${embed.id} (older than ${retentionDays} days)`
        );

        // Log event for audit trail (DSGVO compliance)
        await EventLogs.logEvent(
          "embed_chats_auto_deleted",
          {
            embedId: embed.id,
            deletedCount: count,
            retentionDays: retentionDays,
            cutoffDate: cutoffDate.toISOString(),
          },
          null // System operation, no user
        );
      } catch (embedError) {
        log(
          `  Error processing embed ${embed.id}: ${embedError.message}`
        );
        console.error(embedError);
      }
    }

    log(`Cleanup complete. Total chats deleted: ${totalDeleted}`);
  } catch (e) {
    console.error(e);
    log(`Cleanup errored with: ${e.message}`);
  } finally {
    conclude();
  }
})();
