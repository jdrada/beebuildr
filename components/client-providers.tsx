"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { OrganizationProvider } from "@/contexts/organization-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (previously called cacheTime)
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

export function ClientProviders({ children }: { children: React.ReactNode }) {
  // Use React.useState to create the client to avoid hydration issues
  const [client] = React.useState(() => queryClient);

  return (
    <SessionProvider>
      <QueryClientProvider client={client}>
        <OrganizationProvider>{children}</OrganizationProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </SessionProvider>
  );
}
