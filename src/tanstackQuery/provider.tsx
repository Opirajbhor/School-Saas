"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create one QueryClient for the lifetime of this provider
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // the data is server-rendered and changes on user action, so a
            // refetch on every mount/focus only adds round trips
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
