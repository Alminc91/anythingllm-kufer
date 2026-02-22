/**
 * Test-Script für Cleanup-Job
 * Simuliert den Cleanup-Job und zeigt, was gelöscht werden würde
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testCleanup(dryRun = true) {
  console.log("🧹 Starte Cleanup-Simulation...\n");
  console.log(`Modus: ${dryRun ? "DRY RUN (keine Änderungen)" : "LIVE (echte Löschung)"}\n`);

  try {
    // Find all embeds with a retention policy configured
    const embedsWithRetention = await prisma.embed_configs.findMany({
      where: {
        chat_retention_days: { not: null },
      },
      include: {
        workspace: true,
      },
    });

    if (embedsWithRetention.length === 0) {
      console.log("❌ Keine Embeds mit Retention Policies gefunden.");
      return;
    }

    console.log(
      `✅ ${embedsWithRetention.length} Embed(s) mit Retention Policies gefunden\n`
    );
    console.log("=".repeat(70));

    let totalWouldDelete = 0;

    for (const embed of embedsWithRetention) {
      const retentionDays = embed.chat_retention_days;
      if (!retentionDays || retentionDays <= 0) continue;

      // Calculate cutoff date: now - retention_days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      console.log(`\n📦 Embed ID=${embed.id} (Workspace: ${embed.workspace?.name || "Unbekannt"})`);
      console.log(`   Retention Period: ${retentionDays} Tage`);
      console.log(`   Cutoff Date: ${cutoffDate.toISOString()}`);
      console.log(`   (Chats vor diesem Datum werden gelöscht)\n`);

      // Count chats to be deleted
      const chatsToDelete = await prisma.embed_chats.findMany({
        where: {
          embed_id: embed.id,
          createdAt: { lt: cutoffDate },
        },
        orderBy: { createdAt: "asc" },
      });

      const totalChats = await prisma.embed_chats.count({
        where: { embed_id: embed.id },
      });

      if (chatsToDelete.length === 0) {
        console.log(`   ✅ Keine alten Chats gefunden (0/${totalChats} Chats)`);
        continue;
      }

      console.log(`   🗑️  Zu löschende Chats: ${chatsToDelete.length}/${totalChats}`);
      console.log(`   📊 Ältester Chat: ${chatsToDelete[0].createdAt.toISOString()}`);
      console.log(`   📊 Neuester zu löschender Chat: ${chatsToDelete[chatsToDelete.length - 1].createdAt.toISOString()}\n`);

      // Show first 3 chats that would be deleted
      console.log(`   Beispiel-Chats (erste 3):`);
      chatsToDelete.slice(0, 3).forEach((chat, idx) => {
        const daysOld = Math.floor(
          (new Date() - new Date(chat.createdAt)) / (1000 * 60 * 60 * 24)
        );
        console.log(
          `     ${idx + 1}. Chat ID=${chat.id}, Alter=${daysOld} Tage, Erstellt=${chat.createdAt.toISOString().split("T")[0]}`
        );
      });

      totalWouldDelete += chatsToDelete.length;

      // Actually delete if not dry run
      if (!dryRun) {
        console.log(`\n   🔥 LÖSCHE ${chatsToDelete.length} Chats...`);
        await prisma.embed_chats.deleteMany({
          where: {
            embed_id: embed.id,
            createdAt: { lt: cutoffDate },
          },
        });

        // Log event for audit trail
        await prisma.event_logs.create({
          data: {
            event: "embed_chats_auto_deleted",
            metadata: JSON.stringify({
              embedId: embed.id,
              deletedCount: chatsToDelete.length,
              retentionDays: retentionDays,
              cutoffDate: cutoffDate.toISOString(),
              testRun: false,
            }),
            userId: null,
          },
        });

        console.log(`   ✅ ${chatsToDelete.length} Chats gelöscht!`);
      }

      console.log("\n" + "-".repeat(70));
    }

    console.log("\n" + "=".repeat(70));
    console.log("📊 ZUSAMMENFASSUNG");
    console.log("=".repeat(70));
    console.log(`Gesamt zu löschende Chats: ${totalWouldDelete}`);

    if (dryRun) {
      console.log("\n⚠️  DRY RUN - Keine Änderungen vorgenommen!");
      console.log("💡 Führen Sie 'node test-cleanup.js --live' aus, um tatsächlich zu löschen.");
    } else {
      console.log("\n✅ Cleanup abgeschlossen!");

      // Show event logs
      console.log("\n📜 Event Logs (letzte 5):");
      const logs = await prisma.event_logs.findMany({
        where: { event: "embed_chats_auto_deleted" },
        orderBy: { occurredAt: "desc" },
        take: 5,
      });

      logs.forEach((log, idx) => {
        const metadata = JSON.parse(log.metadata || "{}");
        console.log(`   ${idx + 1}. ${log.occurredAt.toISOString()}: ${metadata.deletedCount} Chats gelöscht (Embed ${metadata.embedId})`);
      });
    }

    console.log("\n");
  } catch (error) {
    console.error("❌ Fehler beim Cleanup:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const isLive = args.includes("--live");

// Run cleanup
testCleanup(!isLive)
  .then(() => {
    console.log("🎉 Cleanup-Test abgeschlossen!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Fehler:", error);
    process.exit(1);
  });
