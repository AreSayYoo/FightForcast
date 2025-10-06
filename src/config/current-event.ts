export const CURRENT_EVENT = {
  id: "ufc-313",
  name: "UFC 313: Pereira vs Ankalaev",
  dateIso: "2024-06-01T00:00:00Z",
  fights: [
    {
      id: "1",
      bout: "Lightweight",
      fighter1: "King Green",
      fighter2: "Mauricio Ruffy",
    },
    {
      id: "2",
      bout: "Women's Strawweight",
      fighter1: "Amanda Lemos",
      fighter2: "Iasmin Lucindo",
    },
    {
      id: "3",
      bout: "Lightweight",
      fighter1: "Jalin Turner",
      fighter2: "Ignacio Bahamondes",
    },
    {
      id: "4",
      bout: "Lightweight",
      fighter1: "Justin Gaethje",
      fighter2: "Rafael Fiziev",
    },
    {
      id: "5",
      bout: "Light Heavyweight Title",
      fighter1: "Alex Pereira (C)",
      fighter2: "Magomed Ankalaev",
    },
  ],
} as const;

export type FightDefinition = (typeof CURRENT_EVENT.fights)[number];

export const METHOD_OF_VICTORY_VALUES = [
  "TKO_KO",
  "Submission",
  "Decision",
  "Other",
] as const;

export type MethodOfVictoryOption = (typeof METHOD_OF_VICTORY_VALUES)[number];
