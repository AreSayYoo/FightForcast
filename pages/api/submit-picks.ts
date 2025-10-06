import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { MethodOfVictory, Prisma } from "@prisma/client";

import { CURRENT_EVENT, METHOD_OF_VICTORY_VALUES } from "@/config/current-event";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ApiSuccessResponse = {
  message: string;
  savedCount: number;
};

type ApiErrorResponse = {
  error: string;
};

type ParsedPick = {
  fightId: string;
  chosenFighter: string;
  predictMethod: MethodOfVictory;
};

class HttpError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
  }
}

const METHOD_SET = new Set<string>(METHOD_OF_VICTORY_VALUES);
const FIGHT_LOOKUP = new Map(
  CURRENT_EVENT.fights.map((fight) => [fight.id, fight]),
);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseRequestBody = (body: unknown): ParsedPick[] => {
  if (!isRecord(body)) {
    throw new HttpError(400, "Request body must be an object.");
  }

  const { eventId, picks } = body as {
    eventId?: unknown;
    picks?: unknown;
  };

  if (eventId && eventId !== CURRENT_EVENT.id) {
    throw new HttpError(400, "Unsupported event identifier supplied.");
  }

  if (!isRecord(picks)) {
    throw new HttpError(400, "`picks` must be an object keyed by fight id.");
  }

  const parsed: ParsedPick[] = [];

  for (const [fightId, pickValue] of Object.entries(picks)) {
    if (!isRecord(pickValue)) {
      throw new HttpError(400, `Invalid payload for fight ${fightId}.`);
    }

    const fight = FIGHT_LOOKUP.get(fightId);

    if (!fight) {
      throw new HttpError(400, `Unknown fight id received: ${fightId}.`);
    }

    const fighter = pickValue.fighter;
    if (typeof fighter !== "string" || fighter.trim().length === 0) {
      throw new HttpError(400, `Fighter selection missing for fight ${fightId}.`);
    }

    const trimmedFighter = fighter.trim();
    if (trimmedFighter !== fight.fighter1 && trimmedFighter !== fight.fighter2) {
      throw new HttpError(
        400,
        `Fighter selection ${trimmedFighter} is invalid for fight ${fightId}.`,
      );
    }

    const method = pickValue.method;
    if (typeof method !== "string" || !METHOD_SET.has(method)) {
      throw new HttpError(
        400,
        `Method of victory is invalid for fight ${fightId}.`,
      );
    }

    parsed.push({
      fightId,
      chosenFighter: trimmedFighter,
      predictMethod: method as MethodOfVictory,
    });
  }

  if (parsed.length === 0) {
    throw new HttpError(400, "No picks were provided in the request body.");
  }

  return parsed;
};

const ensureEvent = async (tx: Prisma.TransactionClient) => {
  const eventDate = new Date(CURRENT_EVENT.dateIso);

  const existingById = await tx.event.findUnique({
    where: { id: CURRENT_EVENT.id },
  });

  if (existingById) {
    const requiresUpdate =
      existingById.name !== CURRENT_EVENT.name ||
      existingById.date.getTime() !== eventDate.getTime();

    if (requiresUpdate) {
      return tx.event.update({
        where: { id: existingById.id },
        data: { name: CURRENT_EVENT.name, date: eventDate },
      });
    }

    return existingById;
  }

  const existingByName = await tx.event.findFirst({
    where: { name: CURRENT_EVENT.name },
  });

  if (existingByName) {
    return tx.event.update({
      where: { id: existingByName.id },
      data: { name: CURRENT_EVENT.name, date: eventDate },
    });
  }

  return tx.event.create({
    data: {
      id: CURRENT_EVENT.id,
      name: CURRENT_EVENT.name,
      date: eventDate,
    },
  });
};

const ensureFights = async (
  tx: Prisma.TransactionClient,
  eventId: string,
): Promise<void> => {
  await Promise.all(
    CURRENT_EVENT.fights.map((fight) =>
      tx.fight.upsert({
        where: { id: fight.id },
        update: {
          eventID: eventId,
          fighterA: fight.fighter1,
          fighterB: fight.fighter2,
        },
        create: {
          id: fight.id,
          eventID: eventId,
          fighterA: fight.fighter1,
          fighterB: fight.fighter2,
        },
      }),
    ),
  );
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiSuccessResponse | ApiErrorResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  try {
    const parsedPicks = parseRequestBody(req.body);

    const savedCount = await prisma.$transaction(async (tx) => {
      const event = await ensureEvent(tx);

      await ensureFights(tx, event.id);

      await tx.pick.deleteMany({
        where: { userId: session.user.id, eventId: event.id },
      });

      await tx.pick.createMany({
        data: parsedPicks.map((pick) => ({
          userId: session.user.id,
          eventId: event.id,
          fightId: pick.fightId,
          chosenFighter: pick.chosenFighter,
          predictMethod: pick.predictMethod,
        })),
      });

      return parsedPicks.length;
    });

    return res
      .status(200)
      .json({ message: "Picks submitted successfully.", savedCount });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return res.status(400).json({ error: error.message });
    }

    console.error("Failed to submit picks", error);
    return res.status(500).json({ error: "Failed to submit picks." });
  }
}
