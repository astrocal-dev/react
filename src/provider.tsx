"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { AstrocalApiClient } from "./client";

const AstrocalContext = createContext<AstrocalApiClient | null>(null);

/** Props for the AstrocalProvider component. */
export interface AstrocalProviderProps {
  /** API key for authenticating requests. */
  apiKey: string;
  /** Base URL for the Astrocal API. Defaults to "https://api.astrocal.dev". */
  baseUrl?: string;
  children: ReactNode;
}

/**
 * Provides an Astrocal API client to descendant components via React context.
 *
 * @example
 * ```tsx
 * <AstrocalProvider apiKey="sk_live_...">
 *   <App />
 * </AstrocalProvider>
 * ```
 */
export function AstrocalProvider({ apiKey, baseUrl, children }: AstrocalProviderProps) {
  const client = useMemo(() => new AstrocalApiClient({ apiKey, baseUrl }), [apiKey, baseUrl]);

  return <AstrocalContext.Provider value={client}>{children}</AstrocalContext.Provider>;
}

/**
 * Returns the Astrocal API client from the nearest AstrocalProvider.
 *
 * @throws {Error} if called outside an AstrocalProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const astrocal = useAstrocal();
 *   const { data } = await astrocal.eventTypes.list();
 * }
 * ```
 */
export function useAstrocal(): AstrocalApiClient {
  const client = useContext(AstrocalContext);
  if (!client) {
    throw new Error("useAstrocal must be used within an AstrocalProvider");
  }
  return client;
}
