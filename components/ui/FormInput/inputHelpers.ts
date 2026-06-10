/**
 * inputHelpers.ts
 *
 * Validation utilities and helper functions for the FormInput component.
 * These are intentionally pure functions with no React dependency so they
 * can be reused in server-side logic, tests, or other form libraries.
 */

// ────────────────────────────────────────────────────────────
// Validation helpers
// ────────────────────────────────────────────────────────────

/**
 * Returns an error message when the value is falsy or whitespace-only.
 * @param value  - The field value to check.
 * @param label  - Optional human-readable field name for the error message.
 * @returns Error string or `undefined` if the value is valid.
 */
export function validateRequired(
  value: string | undefined | null,
  label = "This field",
): string | undefined {
  if (!value || value.trim().length === 0) {
    return `${label} is required`;
  }
  return undefined;
}

/**
 * Validates that the value looks like a valid email address.
 * Uses a simple but broadly-accepted regex pattern.
 * @param value - The email string to validate.
 * @returns Error string or `undefined` if the email is valid.
 */
export function validateEmail(value: string): string | undefined {
  if (!value) return undefined; // Let `validateRequired` handle empty values
  // RFC-5322 simplified pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return "Please enter a valid email address";
  }
  return undefined;
}

/**
 * Validates that the string length meets a minimum requirement.
 * @param value     - The string to check.
 * @param minLength - Minimum allowed length.
 * @param label     - Optional human-readable field name for the error message.
 * @returns Error string or `undefined` if the length is acceptable.
 */
export function validateMinLength(
  value: string,
  minLength: number,
  label = "This field",
): string | undefined {
  if (value && value.length < minLength) {
    return `${label} must be at least ${minLength} characters`;
  }
  return undefined;
}

/**
 * Validates that the string length does not exceed a maximum.
 * @param value     - The string to check.
 * @param maxLength - Maximum allowed length.
 * @param label     - Optional human-readable field name for the error message.
 * @returns Error string or `undefined` if the length is acceptable.
 */
export function validateMaxLength(
  value: string,
  maxLength: number,
  label = "This field",
): string | undefined {
  if (value && value.length > maxLength) {
    return `${label} must be at most ${maxLength} characters`;
  }
  return undefined;
}

/**
 * Validates that a string can be parsed as a finite number.
 * @param value - The string value to validate.
 * @param label - Optional human-readable field name for the error message.
 * @returns Error string or `undefined` if the value is a valid number.
 */
export function validateNumber(
  value: string,
  label = "This field",
): string | undefined {
  if (!value) return undefined;
  if (isNaN(Number(value)) || !isFinite(Number(value))) {
    return `${label} must be a valid number`;
  }
  return undefined;
}

// ────────────────────────────────────────────────────────────
// Display helpers
// ────────────────────────────────────────────────────────────

/**
 * Formats a current/max character count for display.
 * @param current - Current number of characters.
 * @param max     - Maximum allowed characters.
 * @returns A formatted string like "42 / 200".
 */
export function formatCharacterCount(current: number, max: number): string {
  return `${current} / ${max}`;
}

/**
 * Generates a unique id for an input field when one is not explicitly provided.
 * Uses the label text to create a URL-safe id.
 * @param label - The label string to derive the id from.
 * @returns A kebab-cased id string, e.g. "first-name".
 */
export function generateInputId(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
