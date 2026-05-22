/**
 * Normalizes phone numbers consistently across frontend and backend.
 * Strips spaces, dashes, parentheses.
 * Converts '00' prefix to '+' prefix.
 * Ensures the output starts with a single '+' prefix.
 */
export function normalizePhone(phone: string): string {
    if (!phone) return "";
    let cleaned = phone.replace(/[\s\-\(\)]/g, "");
    // Convert 00 to +
    if (cleaned.startsWith("00")) {
        cleaned = "+" + cleaned.slice(2);
    }
    // Ensure starts with +
    if (!cleaned.startsWith("+")) {
        cleaned = "+" + cleaned;
    }
    return cleaned;
}
