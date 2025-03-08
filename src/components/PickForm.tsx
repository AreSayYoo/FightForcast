"use client";
import { useSession } from "next-auth/react";
import React from "react";
import { useState } from "react";
import {Button} from "@/components/ui/button";


export default function PickForm({ fights, eventId }) {
  const { data: session } = useSession();
  const [selectedFighter, setSelectedFighter] = useState({});

  const handleSubmit = async (fightId: string, fighter: string) => {
    if (!session) return;
    setSelectedFighter({ ...selectedFighter, [fightId]: fighter });

    /*await fetch("/api/picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: session.user.id,
        eventId,
        fightId,
        chosenFighter: fighter,
      }),
    });*/
  };

  return (
    <div className="p-4 border rounded-md">
      <h2 className="text-xl font-bold mb-4">Make Your Picks</h2>
      {fights.map((fight) => (
        <div key={fight.id} className="mb-4">
          <p>
            {fight.fighterA} vs {fight.fighterB}
          </p>
          <button
            className={`px-4 py-2 mr-2 ${selectedFighter[fight.id] === fight.fighterA ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            onClick={() => handleSubmit(fight.id, fight.fighterA)}
          >
            Pick {fight.fighterA}
          </button>
          <button
            className={`px-4 py-2 ${selectedFighter[fight.id] === fight.fighterB ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            onClick={() => handleSubmit(fight.id, fight.fighterB)}
          >
            Pick {fight.fighterB}
          </button>
        </div>
      ))}
    </div>
  );
}
