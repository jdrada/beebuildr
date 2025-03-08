"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Search, X, User } from "lucide-react";

interface UserSearchProps {
  onSelect: (user: UserSearchResult) => void;
  excludeUserIds?: string[];
  placeholder?: string;
}

export interface UserSearchResult {
  id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  image: string | null;
  displayName: string;
}

export function UserSearch({
  onSelect,
  excludeUserIds = [],
  placeholder = "Search by username or email...",
}: UserSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside the search component
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle search query changes with debounce
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const searchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/users/search?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error("Failed to search users");
      }

      const data = await response.json();

      // Filter out excluded users
      const filteredUsers = data.users.filter(
        (user: UserSearchResult) => !excludeUserIds.includes(user.id)
      );

      setResults(filteredUsers);
      setIsOpen(filteredUsers.length > 0);
    } catch (error) {
      console.error("Error searching users:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (user: UserSearchResult) => {
    onSelect(user);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-4 h-4 text-muted-foreground" />
        </div>
        <input
          type="text"
          className="w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
        />
        {query && (
          <button
            title="Clear search"
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={() => {
              setQuery("");
              setResults([]);
              setIsOpen(false);
            }}
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="p-2 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <ul>
              {results.map((user) => (
                <li
                  key={user.id}
                  className="px-4 py-2 hover:bg-muted cursor-pointer flex items-center gap-3"
                  onClick={() => handleSelect(user)}
                >
                  {user.image ? (
                    <div className="relative w-8 h-8 rounded-full overflow-hidden">
                      <Image
                        src={user.image}
                        alt={user.displayName}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="font-medium">{user.displayName}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.username ? `@${user.username}` : user.email}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-2 text-center text-sm text-muted-foreground">
              No users found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
