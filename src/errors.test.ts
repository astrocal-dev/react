import { describe, it, expect } from "vitest";
import { AstrocalError } from "./errors";

describe("AstrocalError", () => {
  it("has correct properties", () => {
    const error = new AstrocalError(404, "not_found", "Event type not found", {
      id: "evt_123",
    });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AstrocalError);
    expect(error.name).toBe("AstrocalError");
    expect(error.status).toBe(404);
    expect(error.code).toBe("not_found");
    expect(error.message).toBe("Event type not found");
    expect(error.details).toEqual({ id: "evt_123" });
  });

  it("works without details", () => {
    const error = new AstrocalError(500, "internal_error", "Something went wrong");

    expect(error.status).toBe(500);
    expect(error.code).toBe("internal_error");
    expect(error.message).toBe("Something went wrong");
    expect(error.details).toBeUndefined();
  });

  it("has a proper stack trace", () => {
    const error = new AstrocalError(400, "bad_request", "Invalid input");
    expect(error.stack).toBeDefined();
  });
});
