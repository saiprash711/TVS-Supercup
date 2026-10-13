/**
 * Server-side dealer name masking service.
 * 
 * CRITICAL: Full dealer names must NEVER be sent to the browser
 * or accessible by competitor dealerships under any circumstances.
 * 
 * Examples:
 *   "Ramesh Motors"      → "R*****"
 *   "Arun Automobiles"   → "A*****"
 *   "Sri Lakshmi Motors" → "S*****"
 *   "R*****"             → "R*****" (preserved)
 */

// Masking enabled for production leaderboard
export const MASKING_ENABLED = true;

/**
 * Mask a dealer name: First letter + asterisks.
 * Strictly guarantees that competitor names cannot be deduced.
 */
export function maskDealerName(fullName?: string | null): string {
  if (!MASKING_ENABLED) return fullName || 'Dealer';
  if (!fullName) return 'D*****';
  const trimmed = String(fullName).trim();
  if (!trimmed || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
    return 'D*****';
  }
  // If already in standard masked format like "A*****", preserve it
  if (/^[A-Z]\*{3,}$/.test(trimmed)) {
    return trimmed;
  }
  // Strip non-alphanumeric leading characters
  const clean = trimmed.replace(/^[^a-zA-Z0-9]+/, '');
  if (!clean) return 'D*****';

  // Find first alphabetic character
  const alphaMatch = clean.match(/[a-zA-Z]/);
  if (alphaMatch) {
    return `${alphaMatch[0].toUpperCase()}*****`;
  }
  return 'D*****';
}

/**
 * Mask a dealer name for the leaderboard context.
 * Uses pre-computed masked name from the database when available.
 */
export function getMaskedDisplayName(dealer: { maskedName?: string | null; displayName?: string | null }): string {
  if (!MASKING_ENABLED) return dealer.displayName || dealer.maskedName || 'Dealer';
  if (dealer.maskedName && dealer.maskedName.includes('*')) {
    return maskDealerName(dealer.maskedName);
  }
  if (dealer.displayName) {
    return maskDealerName(dealer.displayName);
  }
  return 'D*****';
}
