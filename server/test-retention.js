/**
 * Test-Script für DSGVO Retention Period Feature
 * Erstellt Testdaten und simuliert Cleanup
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createTestData() {
  console.log("🚀 Starte Test-Daten-Erstellung...\n");

  try {
    // 1. Workspace erstellen (falls noch nicht vorhanden)
    console.log("📁 Erstelle Test-Workspace...");
    let workspace = await prisma.workspaces.findFirst({
      where: { slug: "test-retention-workspace" },
    });

    if (!workspace) {
      workspace = await prisma.workspaces.create({
        data: {
          name: "Test Retention Workspace",
          slug: "test-retention-workspace",
        },
      });
      console.log(`✅ Workspace erstellt: ID=${workspace.id}`);
    } else {
      console.log(`✅ Workspace gefunden: ID=${workspace.id}`);
    }

    // 2. Embeds mit verschiedenen Retention Periods erstellen
    console.log("\n📦 Erstelle Embeds mit verschiedenen Retention Periods...");

    const embedConfigs = [
      {
        name: "7 Tage Retention",
        chat_retention_days: 7,
        enabled: true,
      },
      {
        name: "30 Tage Retention",
        chat_retention_days: 30,
        enabled: true,
      },
      {
        name: "90 Tage Retention",
        chat_retention_days: 90,
        enabled: true,
      },
      {
        name: "Unbegrenzt (null)",
        chat_retention_days: null,
        enabled: true,
      },
    ];

    const createdEmbeds = [];

    for (const config of embedConfigs) {
      const uuid = `test-embed-${config.chat_retention_days || "unlimited"}-${Date.now()}`;

      const embed = await prisma.embed_configs.create({
        data: {
          uuid: uuid,
          enabled: config.enabled,
          chat_mode: "query",
          workspace_id: workspace.id,
          chat_retention_days: config.chat_retention_days,
        },
      });

      createdEmbeds.push({ ...embed, name: config.name });
      console.log(
        `✅ ${config.name}: Embed ID=${embed.id}, Retention=${config.chat_retention_days || "unbegrenzt"} Tage`
      );
    }

    // 3. Chats mit verschiedenen Alter erstellen
    console.log("\n💬 Erstelle Test-Chats mit verschiedenen Zeitstempeln...");

    const chatConfigs = [
      { daysAgo: 3, label: "3 Tage alt" },
      { daysAgo: 10, label: "10 Tage alt" },
      { daysAgo: 35, label: "35 Tage alt" },
      { daysAgo: 100, label: "100 Tage alt" },
      { daysAgo: 0, label: "Heute" },
    ];

    let totalChatsCreated = 0;

    for (const embed of createdEmbeds) {
      console.log(`\n  Embed "${embed.name}" (ID=${embed.id}):`);

      for (const chatConfig of chatConfigs) {
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - chatConfig.daysAgo);

        const chat = await prisma.embed_chats.create({
          data: {
            prompt: `Test-Frage (${chatConfig.label})`,
            response: `Test-Antwort für ${embed.name}`,
            session_id: `test-session-${Date.now()}-${Math.random()}`,
            embed_id: embed.id,
            createdAt: createdAt,
          },
        });

        totalChatsCreated++;

        const shouldBeDeleted =
          embed.chat_retention_days !== null &&
          chatConfig.daysAgo > embed.chat_retention_days;

        console.log(
          `    ${shouldBeDeleted ? "🗑️ " : "✅ "} Chat ID=${chat.id}: ${
            chatConfig.label
          } (${createdAt.toISOString().split("T")[0]}) ${
            shouldBeDeleted ? "→ SOLLTE GELÖSCHT WERDEN" : "→ bleibt bestehen"
          }`
        );
      }
    }

    console.log(`\n✅ Insgesamt ${totalChatsCreated} Test-Chats erstellt`);

    // 4. Zusammenfassung
    console.log("\n" + "=".repeat(60));
    console.log("📊 ZUSAMMENFASSUNG DER TEST-DATEN");
    console.log("=".repeat(60));

    for (const embed of createdEmbeds) {
      const allChats = await prisma.embed_chats.count({
        where: { embed_id: embed.id },
      });

      let oldChats = 0;
      if (embed.chat_retention_days !== null) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - embed.chat_retention_days);

        oldChats = await prisma.embed_chats.count({
          where: {
            embed_id: embed.id,
            createdAt: { lt: cutoffDate },
          },
        });
      }

      console.log(`\n${embed.name} (ID=${embed.id}):`);
      console.log(`  Retention: ${embed.chat_retention_days || "unbegrenzt"} Tage`);
      console.log(`  Gesamt Chats: ${allChats}`);
      console.log(`  Zu löschende Chats: ${oldChats}`);
      console.log(`  Verbleibende Chats: ${allChats - oldChats}`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("\n✅ Test-Daten erfolgreich erstellt!");
    console.log("\n📝 NÄCHSTE SCHRITTE:");
    console.log("   1. Frontend starten: cd frontend && yarn dev");
    console.log("   2. Zu Settings > Chat-Einbettung > Analytics navigieren");
    console.log("   3. Verschiedene Embeds auswählen und Hinweise prüfen");
    console.log("   4. Cleanup-Job testen: node server/test-cleanup.js");
    console.log("\n");

    return {
      workspace,
      embeds: createdEmbeds,
      totalChatsCreated,
    };
  } catch (error) {
    console.error("❌ Fehler beim Erstellen der Test-Daten:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Script ausführen
createTestData()
  .then(() => {
    console.log("🎉 Test-Daten-Erstellung abgeschlossen!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Fehler:", error);
    process.exit(1);
  });
