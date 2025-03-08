import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // ✅ Get all fights where results are set
    const completedFights = await prisma.fight.findMany({
      where: { winner: { not: null }, method: { not: null } },
    });

    if (!completedFights.length) {
      return res.status(400).json({ error: "No completed fights found." });
    }

    for (const fight of completedFights) {
      // ✅ Find all user picks for this fight
      const picks = await prisma.pick.findMany({
        where: { fightId: fight.id },
      });

      for (const pick of picks) {
        let score = 0;

        // ✅ Award 1 point if they guessed the winner correctly
        if (pick.chosenFighter === fight.winner) {
          score += 1;
          // ✅ Award bonus 2 points if they guessed the method correctly
          if (pick.predictMethod === fight.method) {
            score += 2;
          }
        }

        // ✅ Update the pick's score
        await prisma.pick.update({
          where: { id: pick.id },
          data: { score },
        });
      }
    }

    return res.status(200).json({ message: "Scores updated successfully!" });
  } catch (error) {
    console.error("❌ Error updating scores:", error);
    return res.status(500).json({ error: "Failed to update scores" });
  }
}
