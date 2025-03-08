import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("📥 Received request body:", JSON.stringify(req.body, null, 2));

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    console.error("❌ Unauthorized request");
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userId = session.user.id;
    const { picks } = req.body;

    if (!picks || Object.keys(picks).length === 0) {
      console.error("❌ Picks data is missing or empty:", picks);
      return res.status(400).json({ error: "Picks data is missing or empty." });
    }

    console.log("✅ Parsed picks:", JSON.stringify(picks, null, 2));

    // ✅ Ensure event exists
    const eventName = "UFC 313: Pereira vs Ankalaev"; // Change if needed
    let event = await prisma.event.findFirst({ where: { name: eventName } });

    if (!event) {
      console.log(`🆕 Creating event: ${eventName}`);
      event = await prisma.event.create({
        data: {
          name: eventName,
          date: new Date("2024-06-01T00:00:00Z"), // Replace with actual event date
        },
      });
      console.log(`✅ Event created:`, event);
    }

    const eventId = event.id;

    // ✅ Ensure fight exists before inserting picks
    const ensureFightExists = async (fightId, fighterA, fighterB) => {
      const existingFight = await prisma.fight.findUnique({
        where: { id: fightId.toString() },
      });

      if (!existingFight) {
        console.log(`🆕 Creating fight ${fightId}: ${fighterA} vs ${fighterB}`);
        await prisma.fight.create({
          data: {
            id: fightId.toString(),
            eventID: eventId,
            fighterA,
            fighterB,
          },
        });
        console.log(`✅ Fight ${fightId} created successfully!`);
      }
    };

    // Prepare picks
    const pickEntries = Object.keys(picks).map((fightId) => ({
      userId,
      eventId,
      fightId: fightId.toString(),
      chosenFighter: picks[fightId]?.fighter?.trim() || "Unknown Fighter",
      predictMethod: picks[fightId]?.method || "Decision",
    }));

    console.log(
      "📝 Final prepared picks:",
      JSON.stringify(pickEntries, null, 2),
    );

    // ✅ Insert each pick
    for (const pick of pickEntries) {
      // Ensure fight exists before inserting pick
      await ensureFightExists(pick.fightId, "Fighter 1", "Fighter 2"); // Replace with actual fighter names

      try {
        const savedPick = await prisma.pick.create({ data: pick });
        console.log(
          `✅ Prisma saved pick for fight ${pick.fightId}:`,
          savedPick,
        );
      } catch (prismaError) {
        console.error(
          `❌ Prisma Error inserting pick for fightId: ${pick.fightId}`,
        );
        console.error(
          "🔍 Full Prisma Error:",
          JSON.stringify(prismaError, null, 2),
        );
      }
    }

    return res.status(200).json({ message: "Picks submitted successfully!" });
  } catch (error) {
    console.error("❌ General error submitting picks:", error);
    return res
      .status(500)
      .json({ error: "Failed to submit picks", details: error.message });
  }
}
9