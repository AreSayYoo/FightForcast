"use client";
import "@/styles/globals.css";import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"; // ✅ Import your custom table component

export default function Leaderboard() {
  const [picks, setPicks] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchPicks() {
      try {
        const res = await fetch("/api/get-leaderboard");
        if (!res.ok) throw new Error("Failed to fetch leaderboard");
        const data = await res.json();

        setPicks(data.userPicks || []);
        setLeaderboard(data.leaderboard || []);
      } catch (error) {
        console.error("❌ Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPicks();
  }, []);

  if (loading) {
    return (
      <p className="text-center text-lg font-semibold">
        Loading leaderboard...
      </p>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-black p-6">
      <h1 className="text-3xl font-bold text-center mb-8">
        🏆 UFC 313 Leaderboard
      </h1>

      {/* User's Picks */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">✅ Your Picks & Scores</h2>
        {picks.length > 0 ? (
          <Table className="border border-gray-700 bg-gray-800">
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Fight</TableHead>
                <TableHead className="text-left">Chosen Fighter</TableHead>
                <TableHead className="text-left">Method</TableHead>
                <TableHead className="text-left">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {picks.map((pick, index) => (
                <TableRow key={index}>
                  <TableCell>Fight {pick.fightId}</TableCell>
                  <TableCell className="font-bold">
                    {pick.chosenFighter}
                  </TableCell>
                  <TableCell>{pick.predictMethod}</TableCell>
                  <TableCell className="font-bold">{pick.score || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-gray-400">You haven't submitted any picks.</p>
        )}
      </div>

      {/* Leaderboard */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold mb-4">🥇 Overall Scores</h2>
        {leaderboard.length > 0 ? (
          <Table className="border border-gray-700 bg-gray-800">
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Rank</TableHead>
                <TableHead className="text-left">User</TableHead>
                <TableHead className="text-left">Total Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell className="text-center">{index + 1}</TableCell>
                  <TableCell>{entry.name}</TableCell>
                  <TableCell className="font-bold">
                    {entry.totalScore}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-gray-400">No leaderboard data available.</p>
        )}
      </div>

      {/* Back Button */}
      <div className="flex justify-center mt-6">
        <Button variant="ghost" onClick={() => router.push("/")}>
          🔙 Back to Home
        </Button>
      </div>
    </div>
  );
}
