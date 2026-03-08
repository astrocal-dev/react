# @astrocal/react

React SDK for [Astrocal](https://astrocal.dev) — Provider, hooks, API client, and embeddable booking widget for React apps.

## Installation

```bash
npm install @astrocal/react
# or
pnpm add @astrocal/react
```

For the widget component, also install the optional peer dependency:

```bash
npm install @astrocal/widget
```

## Quick Start

### Provider Setup

Wrap your app (or a subtree) with `AstrocalProvider` to make the API client available via hooks:

```tsx
import { AstrocalProvider } from "@astrocal/react";

function App() {
  return (
    <AstrocalProvider apiKey="sk_live_...">
      <MySchedulingPage />
    </AstrocalProvider>
  );
}
```

### Using the Hook

Access the typed API client anywhere inside the provider:

```tsx
import { useAstrocal } from "@astrocal/react";

function EventTypesList() {
  const astrocal = useAstrocal();
  const [eventTypes, setEventTypes] = useState([]);

  useEffect(() => {
    astrocal.eventTypes.list().then(({ data }) => setEventTypes(data));
  }, [astrocal]);

  return (
    <ul>
      {eventTypes.map((et) => (
        <li key={et.id}>
          {et.title} — {et.duration_minutes}min
        </li>
      ))}
    </ul>
  );
}
```

### Standalone Client

Use the API client without React context:

```ts
import { AstrocalApiClient } from "@astrocal/react";

const client = new AstrocalApiClient({ apiKey: "sk_live_..." });

const { data: eventTypes } = await client.eventTypes.list();
const { slots } = await client.availability.query({
  event_type_id: eventTypes[0].id,
  start: "2026-03-01",
  end: "2026-03-07",
  timezone: "America/New_York",
});
```

## Widget Component

The `AstrocalWidget` component wraps `@astrocal/widget` for seamless React integration.

### Inline Mode

Renders the booking calendar directly in your page:

```tsx
import { AstrocalWidget } from "@astrocal/react";

function BookingPage() {
  return (
    <AstrocalWidget
      eventTypeId="evt_abc123"
      timezone="America/New_York"
      colorScheme="light"
      onBookingCreated={(booking) => {
        console.log("Booked!", booking.id);
      }}
    />
  );
}
```

### Popup Mode

Wraps a trigger element that opens the widget as a modal on click:

```tsx
import { AstrocalWidget } from "@astrocal/react";

function BookButton() {
  return (
    <AstrocalWidget eventTypeId="evt_abc123" mode="popup">
      <button>Book a Meeting</button>
    </AstrocalWidget>
  );
}
```

### Widget Props

| Prop               | Type                          | Default                      | Description                   |
| ------------------ | ----------------------------- | ---------------------------- | ----------------------------- |
| `eventTypeId`      | `string`                      | —                            | Event type UUID (required)    |
| `mode`             | `"inline" \| "popup"`         | `"inline"`                   | Render mode                   |
| `apiUrl`           | `string`                      | `"https://api.astrocal.dev"` | API base URL                  |
| `timezone`         | `string`                      | auto-detect                  | IANA timezone                 |
| `theme`            | `ThemeConfig`                 | —                            | CSS custom property overrides |
| `colorScheme`      | `"light" \| "dark" \| "auto"` | `"auto"`                     | Color scheme                  |
| `demo`             | `boolean`                     | `false`                      | Demo mode (mock data)         |
| `onBookingCreated` | `(booking) => void`           | —                            | Booking success callback      |
| `onError`          | `(error) => void`             | —                            | Error callback                |
| `onClose`          | `() => void`                  | —                            | Popup close callback          |
| `className`        | `string`                      | —                            | Container CSS class           |
| `style`            | `CSSProperties`               | —                            | Container inline styles       |

## API Client Methods

### Event Types

```ts
client.eventTypes.list(); // GET /v1/event-types
client.eventTypes.get(id); // GET /v1/event-types/:id
client.eventTypes.create(input); // POST /v1/event-types
client.eventTypes.update(id, input); // PATCH /v1/event-types/:id
client.eventTypes.delete(id); // DELETE /v1/event-types/:id
```

### Bookings

```ts
client.bookings.list(params?)               // GET /v1/bookings
client.bookings.get(id)                     // GET /v1/bookings/:id
client.bookings.cancel(id, reason?)         // POST /v1/bookings/:id/cancel
client.bookings.reschedule(id, input)       // POST /v1/bookings/:id/reschedule
```

### Availability

```ts
client.availability.query(params); // GET /v1/availability
```

### Webhooks

```ts
client.webhooks.list()                      // GET /v1/webhooks
client.webhooks.get(id)                     // GET /v1/webhooks/:id
client.webhooks.create(input)               // POST /v1/webhooks
client.webhooks.update(id, input)           // PATCH /v1/webhooks/:id
client.webhooks.delete(id)                 // DELETE /v1/webhooks/:id
client.webhooks.listDeliveries(id, params?) // GET /v1/webhooks/:id/deliveries
client.webhooks.retryDelivery(whId, delId)  // POST /v1/webhooks/:id/deliveries/:id/retry
```

### Usage

```ts
client.usage.get()                          // GET /v1/usage
client.usage.summary(period?)               // GET /v1/usage/summary
```

### API Keys

```ts
client.apiKeys.list(); // GET /v1/api-keys
client.apiKeys.create(input); // POST /v1/api-keys
client.apiKeys.revoke(id); // DELETE /v1/api-keys/:id
```

## Error Handling

All API errors throw `AstrocalError`:

```ts
import { AstrocalError } from "@astrocal/react";

try {
  await client.eventTypes.get("invalid_id");
} catch (err) {
  if (err instanceof AstrocalError) {
    console.log(err.status); // 404
    console.log(err.code); // "not_found"
    console.log(err.message); // "Event type not found"
  }
}
```

## Next.js

Works with both App Router and Pages Router. For App Router, the provider and widget include `"use client"` directives automatically.

```tsx
// app/layout.tsx
import { AstrocalProvider } from "@astrocal/react";

export default function RootLayout({ children }) {
  return (
    <AstrocalProvider apiKey={process.env.NEXT_PUBLIC_ASTROCAL_KEY!}>{children}</AstrocalProvider>
  );
}
```

## TypeScript

All types are exported for use in your application:

```ts
import type {
  EventType,
  Booking,
  AvailabilitySlot,
  PaginatedResponse,
  AstrocalClient,
} from "@astrocal/react";
```

## License

MIT
