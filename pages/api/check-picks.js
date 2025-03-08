import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userId = session.user.id;

    // ✅ Check if user has already submitted picks
    const existingPicks = await prisma.pick.findMany({
      where: { userId },
    });

    return res.status(200).json({ hasSubmitted: existingPicks.length > 0 });
  } catch (error) {
    console.error("❌ Error checking picks:", error);
    return res.status(500).json({ error: "Failed to check picks" });
  }
}
