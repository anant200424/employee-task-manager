/**
 * Input sanitization utilities for MongoDB and query building.
 */

/**
 * Escapes characters that have special meaning in regular expressions.
 * Prevents ReDoS (Regular Expression Denial of Service) and regex syntax injection crashes.
 *
 * @param str - The raw user input string to escape
 * @returns Escaped string safe for RegExp or MongoDB $regex operators
 */
export const escapeRegex = (str: string): string => {
  if (!str || typeof str !== "string") return "";
  return str.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
