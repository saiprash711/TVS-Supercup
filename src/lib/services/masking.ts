/**
 * Server-side dealer name masking service.
 * 
 * CRITICAL: Full dealer names must NEVER be sent to the browser
 * on the public leaderboard. Masking happens here, server-side only.
 * 
 * Examples:
 *   "Ramesh Motors"      → "R*****"
 *   "Arun Automobiles"   → "A*****"
 *   "Sri Lakshmi Motors" → "S*****"
 */

// Masking enabled for production public leaderboard
export const MASKING_ENABLED = true;

/**
 * Mask a dealer name: First letter + asterisks
 */
export function maskDealerName(fullName: string): string {
  if (!MASKING_ENABLED) return fullName || 'Unknown Dealer';
  const normalizedName = fullName?.trim();
  if (!normalizedName) return '*****';
  const firstChar = normalizedName.charAt(0).toUpperCase();
  return `${firstChar}*****`;
}

/**
 * Mask a dealer name for the leaderboard context.
 * Uses pre-computed masked name from the database when available.
 */
export function getMaskedDisplayName(dealer: { maskedName?: string; displayName?: string }): string {
  if (!MASKING_ENABLED) return dealer.displayName || dealer.maskedName || 'Unknown Dealer';
  if (dealer.maskedName) return dealer.maskedName;
  if (dealer.displayName) return maskDealerName(dealer.displayName);
  return '*****';
}
