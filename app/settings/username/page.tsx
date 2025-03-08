"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useSession } from "next-auth/react";

export default function UsernameSettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const [username, setUsername] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Load the current username
  useEffect(() => {
    if (session?.user) {
      fetch("/api/users/me")
        .then((res) => res.json())
        .then((data) => {
          if (data.user?.username) {
            setCurrentUsername(data.user.username);
            setUsername(data.user.username);
          }
        })
        .catch((err) => {
          console.error("Failed to load user data:", err);
        });
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      // Basic client-side validation
      if (username === currentUsername) {
        setError("Please choose a different username");
        setLoading(false);
        return;
      }

      // Server-side validation through API
      const validationResponse = await fetch(
        "/api/settings/validate-username",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username }),
        }
      );

      const validationData = await validationResponse.json();

      if (!validationData.valid) {
        setError(validationData.message || "Invalid username");
        setLoading(false);
        return;
      }

      // Update the username
      const response = await fetch("/api/settings/username", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update username");
      }

      // Update succeeded
      setCurrentUsername(username);
      setMessage("Username updated successfully");

      // Update the session
      await updateSession();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update username"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Username Settings</h1>
          <p className="text-muted-foreground mt-1">
            Set your unique username that others can use to find and mention
            you.
          </p>
        </div>

        {message && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-600 rounded-md">
            {message}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <div className="border rounded-lg p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium mb-1"
              >
                Username
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 bg-muted border border-r-0 border-input rounded-l-md text-muted-foreground">
                  @
                </span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className="flex-1 px-3 py-2 border rounded-r-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="yourname"
                  pattern="[a-z0-9.]{3,20}"
                  title="Username must be 3-20 characters and can only contain lowercase letters, numbers, and dots."
                  required
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                3-20 characters, lowercase letters, numbers, and dots only.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {currentUsername
                  ? `Current username: @${currentUsername}`
                  : "You don't have a username yet"}
              </p>
              <button
                type="submit"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md disabled:opacity-50"
                disabled={loading || !username || username === currentUsername}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        <div className="border rounded-lg p-6 shadow-sm bg-muted">
          <h2 className="text-lg font-medium mb-2">About Usernames</h2>
          <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
            <li>
              Your username is unique and identifies you across the platform
            </li>
            <li>
              Other users can invite you to organizations using your username
            </li>
            <li>
              Changing your username won't affect your existing memberships
            </li>
            <li>
              Usernames are case-insensitive (e.g., @user is the same as @USER)
            </li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
