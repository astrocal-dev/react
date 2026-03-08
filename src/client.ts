import { AstrocalError } from "./errors";
import type {
  AstrocalClient,
  EventType,
  Booking,
  AvailabilityResponse,
  WebhookEndpoint,
  WebhookEndpointCreated,
  WebhookDelivery,
  ApiKey,
  ApiKeyCreated,
  UsageInfo,
  UsageSummary,
  CancelBookingResult,
  PaginatedResponse,
} from "./types";

const DEFAULT_BASE_URL = "https://api.astrocal.dev";

/**
 * Astrocal API client.
 *
 * Provides typed methods for all Astrocal REST API endpoints,
 * organized into namespaced property groups.
 *
 * @example
 * ```ts
 * const client = new AstrocalApiClient({ apiKey: "sk_live_..." });
 * const { data } = await client.eventTypes.list();
 * ```
 */
export class AstrocalApiClient implements AstrocalClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  readonly eventTypes: AstrocalClient["eventTypes"];
  readonly bookings: AstrocalClient["bookings"];
  readonly availability: AstrocalClient["availability"];
  readonly webhooks: AstrocalClient["webhooks"];
  readonly usage: AstrocalClient["usage"];
  readonly apiKeys: AstrocalClient["apiKeys"];

  constructor(config: { apiKey: string; baseUrl?: string }) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");

    this.eventTypes = {
      list: () => this.fetch<PaginatedResponse<EventType>>("GET", "/v1/event-types"),
      get: (id) => this.fetch<EventType>("GET", `/v1/event-types/${id}`),
      create: (input) => this.fetch<EventType>("POST", "/v1/event-types", input),
      update: (id, input) => this.fetch<EventType>("PATCH", `/v1/event-types/${id}`, input),
      delete: (id) => this.fetch<void>("DELETE", `/v1/event-types/${id}`),
    };

    this.bookings = {
      list: (params?) => {
        const query = buildQuery(
          params && {
            event_type_id: params.event_type_id,
            assigned_host_id: params.assigned_host_id,
            starting_after: params.starting_after,
            limit: params.limit,
          },
        );
        return this.fetch<PaginatedResponse<Booking>>("GET", `/v1/bookings${query}`);
      },
      get: (id) => this.fetch<Booking>("GET", `/v1/bookings/${id}`),
      cancel: (id, reason?) =>
        this.fetch<CancelBookingResult>(
          "POST",
          `/v1/bookings/${id}/cancel`,
          reason ? { reason } : {},
        ),
      reschedule: (id, input) =>
        this.fetch<Booking>("POST", `/v1/bookings/${id}/reschedule`, input),
    };

    this.availability = {
      query: (params) => {
        const qs = new URLSearchParams({
          event_type_id: params.event_type_id,
          start: params.start,
          end: params.end,
          timezone: params.timezone,
        });
        return this.fetch<AvailabilityResponse>("GET", `/v1/availability?${qs.toString()}`);
      },
    };

    this.webhooks = {
      list: () => this.fetch<PaginatedResponse<WebhookEndpoint>>("GET", "/v1/webhooks"),
      get: (id) => this.fetch<WebhookEndpoint>("GET", `/v1/webhooks/${id}`),
      create: (input) => this.fetch<WebhookEndpointCreated>("POST", "/v1/webhooks", input),
      update: (id, input) => this.fetch<WebhookEndpoint>("PATCH", `/v1/webhooks/${id}`, input),
      delete: (id) => this.fetch<void>("DELETE", `/v1/webhooks/${id}`),
      listDeliveries: (webhookId, params?) => {
        const query = buildQuery(
          params && {
            starting_after: params.starting_after,
            limit: params.limit,
            status: params.status,
          },
        );
        return this.fetch<PaginatedResponse<WebhookDelivery>>(
          "GET",
          `/v1/webhooks/${webhookId}/deliveries${query}`,
        );
      },
      retryDelivery: (webhookId, deliveryId) =>
        this.fetch<WebhookDelivery>(
          "POST",
          `/v1/webhooks/${webhookId}/deliveries/${deliveryId}/retry`,
        ),
    };

    this.usage = {
      get: () => this.fetch<UsageInfo>("GET", "/v1/usage"),
      summary: (period?) => {
        const query = period ? `?period=${period}` : "";
        return this.fetch<UsageSummary>("GET", `/v1/usage/summary${query}`);
      },
    };

    this.apiKeys = {
      list: () => this.fetch<PaginatedResponse<ApiKey>>("GET", "/v1/api-keys"),
      create: (input) => this.fetch<ApiKeyCreated>("POST", "/v1/api-keys", input),
      revoke: (id) => this.fetch<void>("DELETE", `/v1/api-keys/${id}`),
    };
  }

  /**
   * Internal fetch helper. Sets auth header, handles 204, parses errors.
   */
  private async fetch<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
    };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    let res: Response;
    try {
      res = await globalThis.fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      throw new AstrocalError(
        0,
        "network_error",
        `Failed to connect to API: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }

    if (res.status === 204) {
      return undefined as T;
    }

    let json: Record<string, unknown>;
    try {
      json = await res.json();
    } catch {
      throw new AstrocalError(
        res.status,
        "invalid_response",
        `API returned non-JSON response (status ${res.status})`,
      );
    }

    if (!res.ok) {
      const error = (json.error ?? {}) as Record<string, unknown>;
      throw new AstrocalError(
        res.status,
        (error.code as string) || "unknown_error",
        (error.message as string) || `API error (status ${res.status})`,
        error.details as Record<string, unknown> | undefined,
      );
    }

    return json as T;
  }
}

/**
 * Builds a URL query string from optional parameters.
 * Skips undefined values. Returns empty string or "?key=value&..." format.
 */
function buildQuery(params?: Record<string, string | number | boolean | undefined | null>): string {
  if (!params) return "";
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      qs.set(key, String(value));
    }
  }
  const str = qs.toString();
  return str ? `?${str}` : "";
}
