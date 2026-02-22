const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createOldChats() {
  console.log("🕰️  Erstelle alte Test-Chats für Cleanup-Test...\n");

  const embeds = [
    { id: 2, name: "7 Tage", retention: 7 },
    { id: 3, name: "30 Tage", retention: 30 },
    { id: 4, name: "90 Tage", retention: 90 },
  ];

  for (const embed of embeds) {
    console.log(`📦 Embed #${embed.id} (${embed.name} Retention):`);

    // Create chats that are OLDER than retention period (should be deleted)
    const oldDate1 = new Date();
    oldDate1.setDate(oldDate1.getDate() - (embed.retention + 5)); // 5 Tage älter als Retention
    
    const oldDate2 = new Date();
    oldDate2.setDate(oldDate2.getDate() - (embed.retention + 2)); // 2 Tage älter als Retention

    const chat1 = await prisma.embed_chats.create({
      data: {
        prompt: `[TEST] Alter Chat - sollte gelöscht werden (${embed.retention + 5} Tage alt)`,
        response: "Test-Antwort",
        session_id: `test-old-${Date.now()}-${Math.random()}`,
        embed_id: embed.id,
        createdAt: oldDate1,
      },
    });

    const chat2 = await prisma.embed_chats.create({
      data: {
        prompt: `[TEST] Alter Chat - sollte gelöscht werden (${embed.retention + 2} Tage alt)`,
        response: "Test-Antwort",
        session_id: `test-old-${Date.now()}-${Math.random()}`,
        embed_id: embed.id,
        createdAt: oldDate2,
      },
    });

    console.log(`   ✅ Erstellt: Chat #${chat1.id} (${oldDate1.toISOString().split('T')[0]}) - SOLLTE GELÖSCHT WERDEN`);
    console.log(`   ✅ Erstellt: Chat #${chat2.id} (${oldDate2.toISOString().split('T')[0]}) - SOLLTE GELÖSCHT WERDEN`);

    // Create a chat that is YOUNGER than retention period (should stay)
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - (embed.retention - 2)); // 2 Tage jünger als Retention

    const chat3 = await prisma.embed_chats.create({
      data: {
        prompt: `[TEST] Neuerer Chat - sollte bleiben (${embed.retention - 2} Tage alt)`,
        response: "Test-Antwort",
        session_id: `test-recent-${Date.now()}-${Math.random()}`,
        embed_id: embed.id,
        createdAt: recentDate,
      },
    });

    console.log(`   ✅ Erstellt: Chat #${chat3.id} (${recentDate.toISOString().split('T')[0]}) - SOLLTE BLEIBEN\n`);
  }

  console.log("\n📊 ZUSAMMENFASSUNG:");
  console.log("   Pro Embed: 2 alte Chats (sollten gelöscht werden) + 1 neuerer Chat (sollte bleiben)");
  console.log("   Gesamt: 6 Chats sollten gelöscht werden, 3 sollten bleiben\n");

  await prisma.$disconnect();
}

createOldChats().catch(console.error);
