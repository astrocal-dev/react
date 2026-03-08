/**
 * Loads the @astrocal/widget module dynamically.
 * Extracted to a separate module for testability.
 *
 * @returns The widget module with open, close, and destroy functions
 */
export function loadWidget(): Promise<typeof import("@astrocal/widget")> {
  return import("@astrocal/widget");
}
