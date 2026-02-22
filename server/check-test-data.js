const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkTestData() {
  console.log("📊 AKTUELLER STATUS DER TESTDATEN\n");
  console.log("=" .repeat(70));

  const embeds = await prisma.embed_configs.findMany({
    where: { workspace_id: 3 }, // Test Retention Workspace
    include: { workspace: true },
  });

  for (const embed of embeds) {
    console.log(`\n📦 Embed #${embed.id}: ${embed.workspace?.name || "Unknown"}`);
    console.log(`   Retention: ${embed.chat_retention_days || "unbegrenzt"} Tage`);

    const totalChats = await prisma.embed_chats.count({
      where: { embed_id: embed.id },
    });

    const chats = await prisma.embed_chats.findMany({
      where: { embed_id: embed.id },
      orderBy: { createdAt: "asc" },
    });

    console.log(`   Gesamt Chats: ${totalChats}`);
    
    if (chats.length > 0) {
      console.log(`\n   Chats im Detail:`);
      chats.forEach((chat, idx) => {
        const age = Math.floor((new Date() - new Date(chat.createdAt)) / (1000 * 60 * 60 * 24));
        const createdDate = new Date(chat.createdAt).toISOString().split('T')[0];
        console.log(`     ${idx + 1}. Chat #${chat.id}: ${age} Tage alt (${createdDate})`);
      });
    }

    // Calculate what SHOULD be deleted
    if (embed.chat_retention_days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - embed.chat_retention_days);
      
      const shouldDelete = await prisma.embed_chats.count({
        where: {
          embed_id: embed.id,
          createdAt: { lt: cutoffDate },
        },
      });

      console.log(`\n   ⚠️  Sollten gelöscht werden: ${shouldDelete} Chats (älter als ${embed.chat_retention_days} Tage)`);
    }
    
    console.log("\n" + "-".repeat(70));
  }

  await prisma.$disconnect();
}

checkTestData().catch(console.error);
