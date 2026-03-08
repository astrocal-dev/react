import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AstrocalApiClient } from "./client";
import { AstrocalError } from "./errors";

function mockFetch(response: { status: number; body?: unknown; ok?: boolean }) {
  return vi.fn().mockResolvedValue({
    status: response.status,
    ok: response.ok ?? (response.status >= 200 && response.status < 300),
    json: vi.fn().mockResolvedValue(response.body),
  });
}

describe("AstrocalApiClient", () => {
  const originalFetch = globalThis.fetch;
  let client: AstrocalApiClient;

  beforeEach(() => {
    client = new AstrocalApiClient({
      apiKey: "sk_test_123",
      baseUrl: "https://api.test.com",
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("auth header", () => {
    it("sets Authorization Bearer header on all requests", async () => {
      const fetchMock = mockFetch({ status: 200, body: { data: [], has_more: false } });
      globalThis.fetch = fetchMock;

      await client.eventTypes.list();

      expect(fetchMock).toHaveBeenCalledOnce();
      const [, options] = fetchMock.mock.calls[0]!;
      expect(options.headers.Authorization).toBe("Bearer sk_test_123");
    });
  });

  describe("defaults", () => {
    it("uses default base URL when not provided", async () => {
      const defaultClient = new AstrocalApiClient({ apiKey: "sk_test" });
      const fetchMock = mockFetch({ status: 200, body: { data: [], has_more: false } });
      globalThis.fetch = fetchMock;

      await defaultClient.eventTypes.list();

      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toMatch(/^https:\/\/api\.astrocal\.dev/);
    });

    it("strips trailing slash from base URL", async () => {
      const slashClient = new AstrocalApiClient({
        apiKey: "sk_test",
        baseUrl: "https://api.test.com/",
      });
      const fetchMock = mockFetch({ status: 200, body: { data: [], has_more: false } });
      globalThis.fetch = fetchMock;

      await slashClient.eventTypes.list();

      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/v1/event-types");
    });
  });

  describe("eventTypes", () => {
    it("list calls GET /v1/event-types", async () => {
      const fetchMock = mockFetch({ status: 200, body: { data: [], has_more: false } });
      globalThis.fetch = fetchMock;

      await client.eventTypes.list();

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/v1/event-types");
      expect(options.method).toBe("GET");
    });

    it("get calls GET /v1/event-types/:id", async () => {
      const fetchMock = mockFetch({ status: 200, body: { id: "evt_1" } });
      globalThis.fetch = fetchMock;

      await client.eventTypes.get("evt_1");

      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/v1/event-types/evt_1");
    });

    it("create calls POST /v1/event-types with body", async () => {
      const input = { title: "Test", slug: "test", duration_minutes: 30 };
      const fetchMock = mockFetch({ status: 201, body: { id: "evt_1", ...input } });
      globalThis.fetch = fetchMock;

      await client.eventTypes.create(input);

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/v1/event-types");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toEqual(input);
      expect(options.headers["Content-Type"]).toBe("application/json");
    });

    it("update calls PATCH /v1/event-types/:id", async () => {
      const fetchMock = mockFetch({ status: 200, body: { id: "evt_1", title: "Updated" } });
      globalThis.fetch = fetchMock;

      await client.eventTypes.update("evt_1", { title: "Updated" });

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/v1/event-types/evt_1");
      expect(options.method).toBe("PATCH");
    });

    it("delete calls DELETE /v1/event-types/:id", async () => {
      const fetchMock = mockFetch({ status: 204 });
      globalThis.fetch = fetchMock;

      const result = await client.eventTypes.delete("evt_1");

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/v1/event-types/evt_1");
      expect(options.method).toBe("DELETE");
      expect(result).toBeUndefined();
    });
  });

  describe("bookings", () => {
    it("list calls GET /v1/bookings", async () => {
      const fetchMock = mockFetch({ status: 200, body: { data: [], has_more: false } });
      globalThis.fetch = fetchMock;

      await client.bookings.list();

      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/v1/bookings");
    });

    it("list builds query params correctly", async () => {
      const fetchMock = mockFetch({ status: 200, body: { data: [], has_more: false } });
      globalThis.fetch = fetchMock;

      await client.bookings.list({
        event_type_id: "evt_1",
        limit: 10,
        starting_after: "bk_50",
      });

      const [url] = fetchMock.mock.calls[0]!;
      const parsed = new URL(url);
      expect(parsed.searchParams.get("event_type_id")).toBe("evt_1");
      expect(parsed.searchParams.get("limit")).toBe("10");
      expect(parsed.searchParams.get("starting_after")).toBe("bk_50");
    });

    it("get calls GET /v1/bookings/:id", async () => {
      const fetchMock = mockFetch({ status: 200, body: { id: "bk_1" } });
      globalThis.fetch = fetchMock;

      await client.bookings.get("bk_1");

      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/v1/bookings/bk_1");
    });

    it("cancel calls POST /v1/bookings/:id/cancel", async () => {
      const fetchMock = mockFetch({
        status: 200,
        body: { id: "bk_1", status: "cancelled", cancelled_at: "2026-01-01T00:00:00Z" },
      });
      globalThis.fetch = fetchMock;

      await client.bookings.cancel("bk_1", "Changed plans");

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/v1/bookings/bk_1/cancel");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toEqual({ reason: "Changed plans" });
    });

    it("cancel without reason sends empty object", async () => {
      const fetchMock = mockFetch({
        status: 200,
        body: { id: "bk_1", status: "cancelled", cancelled_at: "2026-01-01T00:00:00Z" },
      });
      globalThis.fetch = fetchMock;

      await client.bookings.cancel("bk_1");

      const [, options] = fetchMock.mock.calls[0]!;
      expect(JSON.parse(options.body)).toEqual({});
    });

    it("reschedule calls POST /v1/bookings/:id/reschedule", async () => {
      const fetchMock = mockFetch({ status: 200, body: { id: "bk_2" } });
      globalThis.fetch = fetchMock;

      await client.bookings.reschedule("bk_1", {
        new_start_time: "2026-02-01T10:00:00Z",
      });

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/v1/bookings/bk_1/reschedule");
      expect(options.method).toBe("POST");
    });
  });

  describe("availability", () => {
    it("query builds correct query string", async () => {
      const fetchMock = mockFetch({ status: 200, body: { slots: [] } });
      globalThis.fetch = fetchMock;

      await client.availability.query({
        event_type_id: "evt_1",
        start: "2026-03-01",
        end: "2026-03-07",
        timezone: "America/New_York",
      });

      const [url] = fetchMock.mock.calls[0]!;
      const parsed = new URL(url);
      expect(parsed.searchParams.get("event_type_id")).toBe("evt_1");
      expect(parsed.searchParams.get("start")).toBe("2026-03-01");
      expect(parsed.searchParams.get("end")).toBe("2026-03-07");
      expect(parsed.searchParams.get("timezone")).toBe("America/New_York");
    });
  });

  describe("webhooks", () => {
    it("list calls GET /v1/webhooks", async () => {
      const fetchMock = mockFetch({ status: 200, body: { data: [], has_more: false } });
      globalThis.fetch = fetchMock;

      await client.webhooks.list();

      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/v1/webhooks");
    });

    it("create calls POST /v1/webhooks", async () => {
      const input = { url: "https://example.com/hook", events: ["booking.created"] };
      const fetchMock = mockFetch({
        status: 201,
        body: { id: "wh_1", secret: "whsec_xxx", ...input },
      });
      globalThis.fetch = fetchMock;

      await client.webhooks.create(input);

      const [, options] = fetchMock.mock.calls[0]!;
      expect(options.method).toBe("POST");
    });

    it("listDeliveries builds query params", async () => {
      const fetchMock = mockFetch({ status: 200, body: { data: [], has_more: false } });
      globalThis.fetch = fetchMock;

      await client.webhooks.listDeliveries("wh_1", { status: "failed", limit: 5 });

      const [url] = fetchMock.mock.calls[0]!;
      const parsed = new URL(url);
      expect(parsed.pathname).toBe("/v1/webhooks/wh_1/deliveries");
      expect(parsed.searchParams.get("status")).toBe("failed");
      expect(parsed.searchParams.get("limit")).toBe("5");
    });

    it("retryDelivery calls POST", async () => {
      const fetchMock = mockFetch({ status: 200, body: { id: "del_1" } });
      globalThis.fetch = fetchMock;

      await client.webhooks.retryDelivery("wh_1", "del_1");

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/v1/webhooks/wh_1/deliveries/del_1/retry");
      expect(options.method).toBe("POST");
    });
  });

  describe("usage", () => {
    it("get calls GET /v1/usage", async () => {
      const fetchMock = mockFetch({ status: 200, body: { tier: "free" } });
      globalThis.fetch = fetchMock;

      await client.usage.get();

      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/v1/usage");
    });

    it("summary builds period query param", async () => {
      const fetchMock = mockFetch({ status: 200, body: { period: "7d" } });
      globalThis.fetch = fetchMock;

      await client.usage.summary("7d");

      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/v1/usage/summary?period=7d");
    });

    it("summary works without period", async () => {
      const fetchMock = mockFetch({ status: 200, body: { period: "30d" } });
      globalThis.fetch = fetchMock;

      await client.usage.summary();

      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/v1/usage/summary");
    });
  });

  describe("apiKeys", () => {
    it("list calls GET /v1/api-keys", async () => {
      const fetchMock = mockFetch({ status: 200, body: { data: [], has_more: false } });
      globalThis.fetch = fetchMock;

      await client.apiKeys.list();

      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/v1/api-keys");
    });

    it("create calls POST /v1/api-keys", async () => {
      const fetchMock = mockFetch({ status: 201, body: { id: "ak_1", key: "sk_live_xxx" } });
      globalThis.fetch = fetchMock;

      await client.apiKeys.create({ name: "My Key" });

      const [, options] = fetchMock.mock.calls[0]!;
      expect(options.method).toBe("POST");
    });

    it("revoke calls DELETE /v1/api-keys/:id", async () => {
      const fetchMock = mockFetch({ status: 204 });
      globalThis.fetch = fetchMock;

      await client.apiKeys.revoke("ak_1");

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/v1/api-keys/ak_1");
      expect(options.method).toBe("DELETE");
    });
  });

  describe("error handling", () => {
    it("throws AstrocalError on 4xx with error body", async () => {
      globalThis.fetch = mockFetch({
        status: 404,
        ok: false,
        body: { error: { code: "not_found", message: "Event type not found" } },
      });

      await expect(client.eventTypes.get("evt_999")).rejects.toThrow(AstrocalError);

      try {
        await client.eventTypes.get("evt_999");
      } catch (err) {
        const e = err as AstrocalError;
        expect(e.status).toBe(404);
        expect(e.code).toBe("not_found");
        expect(e.message).toBe("Event type not found");
      }
    });

    it("throws AstrocalError on 5xx", async () => {
      globalThis.fetch = mockFetch({
        status: 500,
        ok: false,
        body: { error: { code: "internal_error", message: "Server error" } },
      });

      await expect(client.eventTypes.list()).rejects.toThrow(AstrocalError);
    });

    it("throws AstrocalError with network_error on fetch failure", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

      try {
        await client.eventTypes.list();
        expect.fail("should have thrown");
      } catch (err) {
        const e = err as AstrocalError;
        expect(e).toBeInstanceOf(AstrocalError);
        expect(e.status).toBe(0);
        expect(e.code).toBe("network_error");
        expect(e.message).toContain("Failed to fetch");
      }
    });

    it("throws AstrocalError with invalid_response on non-JSON response", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: vi.fn().mockRejectedValue(new SyntaxError("Unexpected token")),
      });

      try {
        await client.eventTypes.list();
        expect.fail("should have thrown");
      } catch (err) {
        const e = err as AstrocalError;
        expect(e).toBeInstanceOf(AstrocalError);
        expect(e.code).toBe("invalid_response");
        expect(e.status).toBe(200);
      }
    });

    it("204 returns undefined", async () => {
      globalThis.fetch = mockFetch({ status: 204 });

      const result = await client.eventTypes.delete("evt_1");
      expect(result).toBeUndefined();
    });

    it("uses fallback code and message for malformed error body", async () => {
      globalThis.fetch = mockFetch({
        status: 422,
        ok: false,
        body: { error: {} },
      });

      try {
        await client.eventTypes.create({ title: "", slug: "", duration_minutes: 0 });
        expect.fail("should have thrown");
      } catch (err) {
        const e = err as AstrocalError;
        expect(e.code).toBe("unknown_error");
        expect(e.message).toBe("API error (status 422)");
      }
    });
  });

  describe("Content-Type header", () => {
    it("sets Content-Type for requests with body", async () => {
      const fetchMock = mockFetch({ status: 201, body: { id: "evt_1" } });
      globalThis.fetch = fetchMock;

      await client.eventTypes.create({ title: "Test", slug: "test", duration_minutes: 30 });

      const [, options] = fetchMock.mock.calls[0]!;
      expect(options.headers["Content-Type"]).toBe("application/json");
    });

    it("does not set Content-Type for GET requests", async () => {
      const fetchMock = mockFetch({ status: 200, body: { data: [], has_more: false } });
      globalThis.fetch = fetchMock;

      await client.eventTypes.list();

      const [, options] = fetchMock.mock.calls[0]!;
      expect(options.headers["Content-Type"]).toBeUndefined();
    });
  });
});
