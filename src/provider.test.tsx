import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { AstrocalProvider, useAstrocal } from "./provider";
import { AstrocalApiClient } from "./client";

function createWrapper(apiKey: string, baseUrl?: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AstrocalProvider apiKey={apiKey} baseUrl={baseUrl}>
        {children}
      </AstrocalProvider>
    );
  };
}

describe("AstrocalProvider + useAstrocal", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("useAstrocal returns client instance inside provider", () => {
    const { result } = renderHook(() => useAstrocal(), {
      wrapper: createWrapper("sk_test_123"),
    });

    expect(result.current).toBeInstanceOf(AstrocalApiClient);
  });

  it("useAstrocal throws outside provider", () => {
    expect(() => {
      renderHook(() => useAstrocal());
    }).toThrow("useAstrocal must be used within an AstrocalProvider");
  });

  it("changing apiKey creates new client", () => {
    const { result, rerender } = renderHook(() => useAstrocal(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <AstrocalProvider apiKey="sk_test_1">{children}</AstrocalProvider>
      ),
    });

    const firstClient = result.current;

    rerender({
      children: renderHook(() => useAstrocal(), {
        wrapper: createWrapper("sk_test_2"),
      }),
    });

    // Re-render with new wrapper
    const { result: result2 } = renderHook(() => useAstrocal(), {
      wrapper: createWrapper("sk_test_2"),
    });

    expect(result2.current).toBeInstanceOf(AstrocalApiClient);
    expect(result2.current).not.toBe(firstClient);
  });

  it("changing baseUrl creates new client", () => {
    const { result: result1 } = renderHook(() => useAstrocal(), {
      wrapper: createWrapper("sk_test_1", "https://api1.test.com"),
    });

    const { result: result2 } = renderHook(() => useAstrocal(), {
      wrapper: createWrapper("sk_test_1", "https://api2.test.com"),
    });

    expect(result1.current).not.toBe(result2.current);
  });

  it("same props return same client instance (memoized)", () => {
    const wrapper = createWrapper("sk_test_stable");
    const { result, rerender } = renderHook(() => useAstrocal(), { wrapper });

    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
