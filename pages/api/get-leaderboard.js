import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userId = session.user.id;

    // ✅ Fetch user's picks & scores
    const userPicks = await prisma.pick.findMany({
      where: { userId },
      include: { fight: true },
    });

    // ✅ Fetch leaderboard sorted by total score
    const leaderboard = await prisma.user.findMany({
      include: {
        picks: {
          select: {
            score: true,
          },
        },
      },
    });

    // ✅ Calculate total scores for each user
    const sortedLeaderboard = leaderboard
      .map((user) => ({
        name: user.name,
        totalScore: user.picks.reduce(
          (acc, pick) => acc + (pick.score || 0),
          0,
        ),
      }))
      .sort((a, b) => b.totalScore - a.totalScore);

    return res.status(200).json({ userPicks, leaderboard: sortedLeaderboard });
  } catch (error) {
    console.error("❌ Error fetching leaderboard:", error);
    return res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
}
