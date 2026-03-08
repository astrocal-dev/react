// ─── Resource Types ─────────────────────────────────────────────

/** Event type resource as returned by the API. */
export interface EventType {
  id: string;
  organization_id: string;
  title: string;
  slug: string;
  description: string | null;
  duration_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  color: string;
  timezone: string;
  active: boolean;
  is_test: boolean;
  price_amount: number | null;
  price_currency: string;
  reminder_intervals: number[];
  max_attendees: number;
  assignment_strategy: string;
  created_at: string;
  updated_at: string;
}

/** A single booking attendee. */
export interface BookingAttendee {
  id: string;
  name: string;
  email: string;
  timezone: string;
  is_primary: boolean;
}

/** Assigned host info on a booking. */
export interface AssignedHost {
  member_id: string;
  name: string | null;
  email: string | null;
}

/** Booking resource as returned by the API. */
export interface Booking {
  id: string;
  organization_id: string;
  event_type_id: string;
  calendar_connection_id: string | null;
  assigned_host: AssignedHost | null;
  status: "confirmed" | "cancelled" | "rescheduled" | "pending_payment";
  is_test: boolean;
  start_time: string;
  end_time: string;
  invitee_name: string;
  invitee_email: string;
  invitee_timezone: string;
  notes: string | null;
  cancel_token: string;
  calendar_event_id: string | null;
  metadata: Record<string, unknown>;
  attendee_count: number;
  attendees: BookingAttendee[];
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
}

/** A single available time slot. */
export interface AvailabilitySlot {
  start: string;
  end: string;
  spots_remaining?: number;
  total_capacity?: number;
}

/** Availability query response. */
export interface AvailabilityResponse {
  slots: AvailabilitySlot[];
}

/** Webhook endpoint resource (no secret). */
export interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

/** Webhook endpoint returned on creation (includes secret, shown once). */
export interface WebhookEndpointCreated extends WebhookEndpoint {
  secret: string;
}

/** Webhook delivery record. */
export interface WebhookDelivery {
  id: string;
  webhook_endpoint_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  status: "pending" | "success" | "failed";
  attempts: number;
  last_attempt_at: string | null;
  response_status_code: number | null;
  response_body: string | null;
  next_retry_at: string | null;
  created_at: string;
}

/** API key resource (plain-text key not included). */
export interface ApiKey {
  id: string;
  name: string;
  description?: string;
  key_prefix: string;
  last_used_at?: string;
  created_at: string;
  revoked_at?: string;
}

/** API key creation response (includes plain-text key). */
export interface ApiKeyCreated extends ApiKey {
  key: string;
}

/** API usage and rate limit information. */
export interface UsageInfo {
  tier: string;
  limits: {
    api_calls_per_minute: number;
    api_calls_per_day: number;
    bookings_per_month: number;
  };
  usage: {
    api_calls_today: number;
    api_calls_remaining_daily: number;
    bookings_this_month: number;
    bookings_remaining_monthly: number;
  };
  reset_at: {
    daily: string;
    monthly: string;
  };
}

/** Aggregate usage summary for a time period. */
export interface UsageSummary {
  period: string;
  period_start: string;
  period_end: string;
  api_calls: { total: number };
  bookings: { total: number; confirmed: number; cancelled: number; pending_payment: number };
  event_types: { total: number; active: number };
  calendar_connections: { total: number; active: number };
  webhooks: { total_deliveries: number; successful: number; failed: number };
}

// ─── Input Types ────────────────────────────────────────────────

/** Input for creating an event type. */
export interface CreateEventTypeInput {
  title: string;
  slug: string;
  description?: string;
  duration_minutes: number;
  buffer_before_minutes?: number;
  buffer_after_minutes?: number;
  color?: string;
  reminder_intervals?: number[];
  max_attendees?: number;
}

/** Input for updating an event type. */
export interface UpdateEventTypeInput {
  title?: string;
  description?: string;
  duration_minutes?: number;
  buffer_before_minutes?: number;
  buffer_after_minutes?: number;
  color?: string;
  active?: boolean;
  reminder_intervals?: number[];
  max_attendees?: number;
  assignment_strategy?: string;
}

/** Parameters for listing bookings. */
export interface ListBookingsParams {
  event_type_id?: string;
  assigned_host_id?: string;
  starting_after?: string;
  limit?: number;
}

/** Parameters for querying availability. */
export interface QueryAvailabilityParams {
  event_type_id: string;
  start: string;
  end: string;
  timezone: string;
}

/** Input for creating a webhook endpoint. */
export interface CreateWebhookInput {
  url: string;
  events: string[];
  active?: boolean;
}

/** Input for updating a webhook endpoint. */
export interface UpdateWebhookInput {
  url?: string;
  events?: string[];
  active?: boolean;
}

/** Input for creating an API key. */
export interface CreateApiKeyInput {
  name: string;
  description?: string;
}

/** Input for rescheduling a booking. */
export interface RescheduleInput {
  new_start_time: string;
  reason?: string;
}

/** Cancel booking result. */
export interface CancelBookingResult {
  id: string;
  status: "cancelled";
  cancelled_at: string;
}

// ─── Pagination ─────────────────────────────────────────────────

/** Paginated response wrapper. */
export interface PaginatedResponse<T> {
  data: T[];
  has_more: boolean;
}

// ─── Widget Types (re-exports when @astrocal/widget is installed) ─

/** Configuration for the Astrocal booking widget. */
export interface WidgetConfig {
  eventTypeId: string;
  apiUrl?: string;
  mode?: "inline" | "popup";
  target?: string | HTMLElement;
  timezone?: string;
  theme?: ThemeConfig;
  colorScheme?: "light" | "dark" | "auto";
  onBookingCreated?: (booking: BookingResult) => void;
  onError?: (error: WidgetError) => void;
  onClose?: () => void;
  demo?: boolean;
}

/** Theme customization via CSS custom properties. */
export interface ThemeConfig {
  primaryColor?: string;
  primaryHoverColor?: string;
  headingColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderFocusColor?: string;
  borderRadius?: string;
  fontFamily?: string;
}

/** Booking result from the widget. */
export interface BookingResult {
  id: string;
  event_type_id: string;
  status: string;
  start_time: string;
  end_time: string;
  invitee_name: string;
  invitee_email: string;
  invitee_timezone: string;
  notes: string | null;
  cancel_token: string;
  attendee_count: number;
  created_at: string;
}

/** Structured error from the widget. */
export interface WidgetError {
  code: "not_found" | "network_error" | "slot_unavailable" | "validation_error" | "unknown";
  message: string;
}

// ─── Client Interface ───────────────────────────────────────────

/** AstrocalClient interface describing the full API surface. */
export interface AstrocalClient {
  readonly eventTypes: {
    list(): Promise<PaginatedResponse<EventType>>;
    get(id: string): Promise<EventType>;
    create(input: CreateEventTypeInput): Promise<EventType>;
    update(id: string, input: UpdateEventTypeInput): Promise<EventType>;
    delete(id: string): Promise<void>;
  };
  readonly bookings: {
    list(params?: ListBookingsParams): Promise<PaginatedResponse<Booking>>;
    get(id: string): Promise<Booking>;
    cancel(id: string, reason?: string): Promise<CancelBookingResult>;
    reschedule(id: string, input: RescheduleInput): Promise<Booking>;
  };
  readonly availability: {
    query(params: QueryAvailabilityParams): Promise<AvailabilityResponse>;
  };
  readonly webhooks: {
    list(): Promise<PaginatedResponse<WebhookEndpoint>>;
    get(id: string): Promise<WebhookEndpoint>;
    create(input: CreateWebhookInput): Promise<WebhookEndpointCreated>;
    update(id: string, input: UpdateWebhookInput): Promise<WebhookEndpoint>;
    delete(id: string): Promise<void>;
    listDeliveries(
      webhookId: string,
      params?: { starting_after?: string; limit?: number; status?: string },
    ): Promise<PaginatedResponse<WebhookDelivery>>;
    retryDelivery(webhookId: string, deliveryId: string): Promise<WebhookDelivery>;
  };
  readonly usage: {
    get(): Promise<UsageInfo>;
    summary(period?: "7d" | "30d"): Promise<UsageSummary>;
  };
  readonly apiKeys: {
    list(): Promise<PaginatedResponse<ApiKey>>;
    create(input: CreateApiKeyInput): Promise<ApiKeyCreated>;
    revoke(id: string): Promise<void>;
  };
}
