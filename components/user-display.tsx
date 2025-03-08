"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export function UserUsername() {
  const { data: session } = useSession();
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/users/me")
        .then((res) => res.json())
        .then((data) => {
          if (data.user?.username) {
            setUsername(data.user.username);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load user data:", err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [session]);

  if (!session?.user || loading) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-sm font-medium text-muted-foreground">
        @{username || "no-username"}
      </span>
      {!username && (
        <Link
          href="/settings/username"
          className="text-xs underline text-primary"
        >
          (set username)
        </Link>
      )}
    </div>
  );
}
