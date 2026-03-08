import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, cleanup, act } from "@testing-library/react";
import { AstrocalWidget } from "./widget";

const mockOpen = vi.fn();
const mockDestroy = vi.fn();

vi.mock("./load-widget", () => ({
  loadWidget: () =>
    Promise.resolve({
      open: (...args: unknown[]) => mockOpen(...args),
      destroy: (...args: unknown[]) => mockDestroy(...args),
      close: vi.fn(),
    }),
}));

/** Flush microtask queue so the async loadWidget() resolves. */
async function flush() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

describe("AstrocalWidget", () => {
  beforeEach(() => {
    mockOpen.mockClear();
    mockDestroy.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  describe("inline mode", () => {
    it("renders a container div", () => {
      const { container } = render(<AstrocalWidget eventTypeId="evt_1" />);
      expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
    });

    it("calls widget.open on mount with correct config", async () => {
      await act(async () => {
        render(
          <AstrocalWidget
            eventTypeId="evt_1"
            apiUrl="https://api.test.com"
            timezone="America/New_York"
            colorScheme="dark"
            demo
          />,
        );
      });

      await flush();

      expect(mockOpen).toHaveBeenCalledOnce();

      const config = mockOpen.mock.calls[0]![0];
      expect(config.eventTypeId).toBe("evt_1");
      expect(config.mode).toBe("inline");
      expect(config.apiUrl).toBe("https://api.test.com");
      expect(config.timezone).toBe("America/New_York");
      expect(config.colorScheme).toBe("dark");
      expect(config.demo).toBe(true);
      expect(config.target).toBeInstanceOf(HTMLDivElement);
    });

    it("calls widget.destroy on unmount", async () => {
      let unmountFn: () => void;
      await act(async () => {
        const { unmount } = render(<AstrocalWidget eventTypeId="evt_1" />);
        unmountFn = unmount;
      });

      await flush();
      expect(mockOpen).toHaveBeenCalledOnce();

      await act(async () => {
        unmountFn();
      });

      await flush();
      expect(mockDestroy).toHaveBeenCalledOnce();
      expect(mockDestroy.mock.calls[0]![0]).toBeInstanceOf(HTMLDivElement);
    });

    it("applies className and style to container", () => {
      const { container } = render(
        <AstrocalWidget eventTypeId="evt_1" className="my-widget" style={{ minHeight: 400 }} />,
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div.className).toBe("my-widget");
      expect(div.style.minHeight).toBe("400px");
    });
  });

  describe("popup mode", () => {
    it("renders children", () => {
      const { getByText } = render(
        <AstrocalWidget eventTypeId="evt_1" mode="popup">
          <button>Book Now</button>
        </AstrocalWidget>,
      );

      expect(getByText("Book Now")).toBeDefined();
    });

    it("calls widget.open with mode popup on click", async () => {
      const { getByText } = render(
        <AstrocalWidget eventTypeId="evt_1" mode="popup">
          <button>Book Now</button>
        </AstrocalWidget>,
      );

      await act(async () => {
        fireEvent.click(getByText("Book Now"));
      });

      await flush();

      expect(mockOpen).toHaveBeenCalledOnce();
      const config = mockOpen.mock.calls[0]![0];
      expect(config.eventTypeId).toBe("evt_1");
      expect(config.mode).toBe("popup");
    });

    it("applies className and style to wrapper", () => {
      const { container } = render(
        <AstrocalWidget
          eventTypeId="evt_1"
          mode="popup"
          className="popup-trigger"
          style={{ cursor: "pointer" }}
        >
          <button>Book</button>
        </AstrocalWidget>,
      );

      const div = container.firstChild as HTMLDivElement;
      expect(div.className).toBe("popup-trigger");
      expect(div.style.cursor).toBe("pointer");
    });
  });

  describe("callbacks", () => {
    it("wires onBookingCreated callback through to widget config", async () => {
      const onBookingCreated = vi.fn();

      await act(async () => {
        render(<AstrocalWidget eventTypeId="evt_1" onBookingCreated={onBookingCreated} />);
      });

      await flush();

      const config = mockOpen.mock.calls[0]![0];
      expect(config.onBookingCreated).toBeDefined();
      const fakeBooking = { id: "bk_1" };
      config.onBookingCreated(fakeBooking);
      expect(onBookingCreated).toHaveBeenCalledWith(fakeBooking);
    });

    it("wires onError callback through to widget config", async () => {
      const onError = vi.fn();

      await act(async () => {
        render(<AstrocalWidget eventTypeId="evt_1" onError={onError} />);
      });

      await flush();

      const config = mockOpen.mock.calls[0]![0];
      const fakeError = { code: "unknown" as const, message: "test error" };
      config.onError(fakeError);
      expect(onError).toHaveBeenCalledWith(fakeError);
    });
  });
});
