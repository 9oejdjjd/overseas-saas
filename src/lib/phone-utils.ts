/**
 * Normalizes phone numbers consistently across frontend and backend.
 * Strips spaces, dashes, parentheses.
 * Converts '00' prefix to '+' prefix.
 * Ensures the output starts with a single '+' prefix.
 */
export function normalizePhone(phone: string): string {
    if (!phone) return "";
    let cleaned = phone.replace(/[\s\-\(\)]/g, "");
    
    // Convert 00 prefix to +
    if (cleaned.startsWith("00")) {
        cleaned = "+" + cleaned.slice(2);
    }
    
    let localMatch = cleaned;
    if (localMatch.startsWith("+")) {
        localMatch = localMatch.slice(1);
    }
    
    // Strip leading zero if it is a local mobile format (e.g. 0777263111 -> 777263111)
    if (localMatch.startsWith("0") && localMatch.length === 10) {
        localMatch = localMatch.slice(1);
    }
    
    // If it is exactly 9 digits and starts with a Yemeni mobile operator prefix (77, 73, 71, 70)
    if (localMatch.length === 9 && /^(77|73|71|70)/.test(localMatch)) {
        cleaned = "+967" + localMatch;
    } else {
        // Fallback: Ensure it starts with '+'
        if (!cleaned.startsWith("+")) {
            cleaned = "+" + cleaned;
        }
    }
    
    return cleaned;
}
