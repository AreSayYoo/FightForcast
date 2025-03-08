"use client";
import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(""); // Reset error state

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      });

      if (response.ok) {
        alert("Sign-up successful! Please log in.");
        setIsSignUp(false);
        setEmail("");
        setPassword("");
        setName("");
        setConfirmPassword("");
      } else {
        const errorData = await response.json();
        setError(errorData.error);
      }
    } else {
      // ✅ Use NextAuth `signIn` function for login
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl: "/", // Redirect after login
      });

      if (result?.error) {
        setError(result.error);
      }
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-xl font-bold">
              {isSignUp
                ? "Sign Up for Fight Forecasters"
                : "Welcome to Fight Forecasters"}
            </h1>
            <div className="text-center text-sm">
              {isSignUp ? (
                <>
                  Already have an account?{" "}
                  <a
                    href="#"
                    className="underline underline-offset-4"
                    onClick={() => setIsSignUp(false)}
                  >
                    Log in
                  </a>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{" "}
                  <a
                    href="#"
                    className="underline underline-offset-4"
                    onClick={() => setIsSignUp(true)}
                  >
                    Sign up
                  </a>
                </>
              )}
            </div>
          </div>

          {isSignUp && (
            <div className="grid gap-2">
              <Label htmlFor="name">Username</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isSignUp && (
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="********"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}

          {error && <p className="text-red-500">{error}</p>}
          <Button type="submit" className="w-full">
            {isSignUp ? "Sign Up" : "Login"}
          </Button>
        </div>
      </form>
    </div>
  );
}
