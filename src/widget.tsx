"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { loadWidget } from "./load-widget";
import type { ThemeConfig, WidgetError, BookingResult } from "./types";

/** Props for the AstrocalWidget component. */
export interface AstrocalWidgetProps {
  /** The event type UUID to display. */
  eventTypeId: string;
  /** Render mode: "inline" mounts directly, "popup" opens as a modal. */
  mode?: "inline" | "popup";
  /** API base URL. Defaults to "https://api.astrocal.dev". */
  apiUrl?: string;
  /** IANA timezone override. Auto-detected if not provided. */
  timezone?: string;
  /** Theme customization via CSS custom properties. */
  theme?: ThemeConfig;
  /** Color scheme: "light", "dark", or "auto". Defaults to "auto". */
  colorScheme?: "light" | "dark" | "auto";
  /** Enable demo mode — uses mock data, no API calls. */
  demo?: boolean;
  /** Callback fired after a booking is successfully created. */
  onBookingCreated?: (booking: BookingResult) => void;
  /** Callback fired when the widget encounters an error. */
  onError?: (error: WidgetError) => void;
  /** Callback fired when the popup is closed. */
  onClose?: () => void;
  /** Additional CSS class name for the container element. */
  className?: string;
  /** Inline styles for the container element. */
  style?: CSSProperties;
  /** Children (rendered as trigger for popup mode). */
  children?: ReactNode;
}

/**
 * Embeddable Astrocal booking widget for React.
 *
 * In inline mode, renders a container div and mounts the widget into it.
 * In popup mode, renders children as a click trigger that opens the widget as a modal.
 *
 * Requires `@astrocal/widget` as an optional peer dependency.
 *
 * @example
 * ```tsx
 * // Inline
 * <AstrocalWidget eventTypeId="evt_abc123" />
 *
 * // Popup
 * <AstrocalWidget eventTypeId="evt_abc123" mode="popup">
 *   <button>Book a Meeting</button>
 * </AstrocalWidget>
 * ```
 */
export function AstrocalWidget({
  eventTypeId,
  mode = "inline",
  apiUrl,
  timezone,
  theme,
  colorScheme,
  demo,
  onBookingCreated,
  onError,
  onClose,
  className,
  style,
  children,
}: AstrocalWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbacksRef = useRef({ onBookingCreated, onError, onClose });
  callbacksRef.current = { onBookingCreated, onError, onClose };

  // Inline mode: mount widget into container div
  useEffect(() => {
    if (mode !== "inline") return;

    const el = containerRef.current;
    if (!el) return;

    let destroyed = false;

    loadWidget()
      .then((widget) => {
        if (destroyed) return;
        widget.open({
          eventTypeId,
          mode: "inline",
          target: el,
          apiUrl,
          timezone,
          theme,
          colorScheme,
          demo,
          onBookingCreated: (booking) => callbacksRef.current.onBookingCreated?.(booking),
          onError: (error) => callbacksRef.current.onError?.(error),
          onClose: () => callbacksRef.current.onClose?.(),
        });
      })
      .catch((err) => {
        callbacksRef.current.onError?.({
          code: "unknown",
          message:
            err instanceof Error
              ? `Failed to load @astrocal/widget: ${err.message}`
              : "Failed to load @astrocal/widget",
        });
      });

    return () => {
      destroyed = true;
      loadWidget()
        .then((widget) => widget.destroy(el))
        .catch(() => {});
    };
  }, [eventTypeId, mode, apiUrl, timezone, colorScheme, demo, theme]);

  // Popup mode: open widget on click
  if (mode === "popup") {
    const handleClick = () => {
      loadWidget()
        .then((widget) => {
          widget.open({
            eventTypeId,
            mode: "popup",
            apiUrl,
            timezone,
            theme,
            colorScheme,
            demo,
            onBookingCreated: (booking) => callbacksRef.current.onBookingCreated?.(booking),
            onError: (error) => callbacksRef.current.onError?.(error),
            onClose: () => callbacksRef.current.onClose?.(),
          });
        })
        .catch((err) => {
          callbacksRef.current.onError?.({
            code: "unknown",
            message:
              err instanceof Error
                ? `Failed to load @astrocal/widget: ${err.message}`
                : "Failed to load @astrocal/widget",
          });
        });
    };

    return (
      <div onClick={handleClick} className={className} style={style}>
        {children}
      </div>
    );
  }

  // Inline mode: render container
  return <div ref={containerRef} className={className} style={style} />;
}
