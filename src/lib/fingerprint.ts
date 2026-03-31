import fpPromise from '@fingerprintjs/fingerprintjs';

/**
 * Generates an extreme, highly reliable, unique device fingerprint using a combination
 * of FingerprintJS and a persistent UUID in localStorage to ensure that anonymous users 
 * cannot bypass exam constraints just by changing IP or browser name.
 */
export async function getDeviceFingerprint(): Promise<string> {
    try {
        // 1. Get browser fingerprint
        const fp = await fpPromise.load();
        const result = await fp.get();
        const browserFingerprint = result.visitorId;

        // 2. Fetch or create localStorage persistent ID
        let localId = "";
        
        // Ensure this only runs on the client-side
        if (typeof window !== "undefined") {
            localId = localStorage.getItem("platform_visitor_id") || "";
            if (!localId) {
                // Generate a random ID if not present
                localId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
                localStorage.setItem("platform_visitor_id", localId);
            }
        }

        // Return a combined hash for double safety.
        // Even if they clear localStorage, the browser fingerprint remains mostly constant.
        return `${browserFingerprint}-${localId}`;
    } catch (error) {
        console.error("Failed to generate device fingerprint", error);
        
        // Fallback to localStorage if FingerprintJS fails
        if (typeof window !== "undefined") {
            let localId = localStorage.getItem("platform_visitor_id");
            if (!localId) {
                localId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
                localStorage.setItem("platform_visitor_id", localId);
            }
            return `fallback-${localId}`;
        }
        
        return "unknown-device";
    }
}
