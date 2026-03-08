/**
 * Error class for Astrocal API errors.
 *
 * Thrown by the API client when a request fails. Includes the HTTP status code,
 * a machine-readable error code, and optional structured details.
 */
export class AstrocalError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "AstrocalError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
