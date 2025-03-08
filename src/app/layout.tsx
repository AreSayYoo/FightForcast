"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import { SessionProvider } from "next-auth/react";

export default function Layout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Fight Forecast</title>
      </head>
      <body>
        <SessionProvider>
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            <main className="w-full max-w-3xl p-4 bg-white shadow-md rounded-md">
              {children}
            </main>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
