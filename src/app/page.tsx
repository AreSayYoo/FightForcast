"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // ✅ Import Next.js router
import { LoginForm } from "@/components/login-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  CURRENT_EVENT,
  METHOD_OF_VICTORY_VALUES,
} from "@/config/current-event";

export default function Page() {
  const { data: session } = useSession();
  const router = useRouter();
  const [picks, setPicks] = useState({});
  const [hasSubmittedPicks, setHasSubmittedPicks] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ Check if user has already submitted picks
  useEffect(() => {
    if (!session) return;

    async function checkUserPicks() {
      try {
        const res = await fetch("/api/check-picks");
        const data = await res.json();

        if (res.ok) {
          setHasSubmittedPicks(data.hasSubmitted);
        } else {
          console.error("❌ Error checking picks:", data.error);
        }
      } catch (error) {
        console.error("❌ Failed to check picks:", error);
      } finally {
        setLoading(false);
      }
    }

    checkUserPicks();
  }, [session]);

  // ✅ Handles fighter selection
  const handleFighterPick = (fightId, fighter) => {
    setPicks((prev) => ({
      ...prev,
      [fightId]: {
        ...prev[fightId],
        fighter,
      },
    }));
  };

  // ✅ Handles method of victory selection
  const handleMethod = (fightId, method) => {
    setPicks((prev) => ({
      ...prev,
      [fightId]: {
        ...prev[fightId],
        method,
      },
    }));
  };

  const fights = CURRENT_EVENT.fights;

  // ✅ Handles form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!picks || Object.keys(picks).length === 0) {
      alert("❌ Please make your picks before submitting.");
      return;
    }

    try {
      const response = await fetch("/api/submit-picks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId: CURRENT_EVENT.id, picks }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ Server error:", data);
        alert(data.error || "Failed to submit picks");
        return;
      }

      alert("✅ Picks submitted successfully!");
      router.push("/leaderboard"); // ✅ Redirect to leaderboard
    } catch (error) {
      console.error("❌ Error submitting picks:", error);
      alert("Submission failed. Check console for details.");
    }
  };

  if (loading) {
    return <p className="text-center text-lg">Loading...</p>;
  }

  return (
    <div>
      {session ? (
        <>
          <div className="flex justify-between items-center p-6">
            <p className="text-lg font-semibold">
              Welcome, {session.user?.name || session.user?.email}!
            </p>
            <Button
              onClick={() => signOut()}
              className="bg-red-500 text-white rounded-md"
            >
              Sign out
            </Button>
          </div>

          {hasSubmittedPicks ? (
            <div className="text-center p-6">
              <h2 className="text-xl font-bold">
                ✅ You have already submitted your picks.
              </h2>
              <Button
                onClick={() => router.push("/leaderboard")}
                className="mt-4"
              >
                View Leaderboard
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 p-6">
              <Card className="w-full max-w-2xl shadow-lg rounded-xl border">
                <CardHeader>
                  <CardTitle className="text-2xl text-center font-semibold">
                    {CURRENT_EVENT.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    {fights.map((fight) => (
                      <div
                        key={fight.id}
                        className="border-b pb-6 last:border-none"
                      >
                        <Label className="block text-lg font-medium text-gray-800">
                          {`${fight.id}. ${fight.bout} Bout`}
                        </Label>

                        {/* Fighter Selection */}
                        <div className="flex gap-4 mt-2">
                          <Button
                            type="button"
                            className={`w-full md:w-1/2 py-2 text-lg font-medium ${
                              picks[fight.id]?.fighter === fight.fighter1
                                ? "bg-blue-500 text-white"
                                : ""
                            }`}
                            onClick={() =>
                              handleFighterPick(fight.id, fight.fighter1)
                            }
                          >
                            {fight.fighter1}
                          </Button>
                          <Button
                            type="button"
                            className={`w-full md:w-1/2 py-2 text-lg font-medium ${
                              picks[fight.id]?.fighter === fight.fighter2
                                ? "bg-blue-500 text-white"
                                : ""
                            }`}
                            onClick={() =>
                              handleFighterPick(fight.id, fight.fighter2)
                            }
                          >
                            {fight.fighter2}
                          </Button>
                        </div>

                        {/* Method of Victory Selection */}
                        <div className="mt-3 border border-gray-300 rounded-lg p-3 bg-gray-50">
                          <Label className="text-sm font-semibold text-gray-700">
                            Method of Victory
                          </Label>
                          <RadioGroup
                            className="flex flex-col gap-2 mt-2"
                            onValueChange={(value) =>
                              handleMethod(fight.id, value)
                            }
                            value={picks[fight.id]?.method || ""}
                          >
                            {METHOD_OF_VICTORY_VALUES.map((method) => {
                                const uniqueId = `${fight.id}-${method}`;
                                return (
                                  <div
                                    key={uniqueId}
                                    className="flex items-center gap-2"
                                  >
                                    <RadioGroupItem
                                      value={method}
                                      id={uniqueId}
                                    />
                                    <Label
                                      htmlFor={uniqueId}
                                      className="text-gray-800"
                                    >
                                      {method}
                                    </Label>
                                  </div>
                                );
                              },
                            )}
                          </RadioGroup>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="submit"
                      className="w-full py-3 text-lg font-semibold bg-primary text-white rounded-lg"
                    >
                      Submit Picks
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      ) : (
        <div className="flex min-h-screen flex-col items-center justify-center">
          <LoginForm />
        </div>
      )}
    </div>
  );
}
