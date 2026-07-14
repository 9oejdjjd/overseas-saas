import axios from 'axios';

// OpenWA Server settings from environment variables
const OPENWA_BASE_URL = process.env.OPENWA_BASE_URL || "http://localhost:2785";
const OPENWA_API_KEY = process.env.OPENWA_API_KEY || "";
const OPENWA_SESSION = process.env.OPENWA_SESSION || "default";

/**
 * Format phone number to WhatsApp chatId format (number@c.us)
 */
function formatPhone(phone: string): string {
    let cleanPhone = phone.replace(/[^\d]/g, '');

    // Remove leading zero (local format)
    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);

    const KNOWN_COUNTRY_CODES = [
        '967', '966', '20', '971', '968', '965', '974', '973',
        '962', '964', '963', '90', '249', '251', '252', '253'
    ];

    const hasCountryCode = KNOWN_COUNTRY_CODES.some(code => cleanPhone.startsWith(code));

    // Only add 967 (Yemen) if the number looks local
    if (!hasCountryCode && cleanPhone.length <= 9) {
        cleanPhone = '967' + cleanPhone;
    }

    // Append @c.us suffix for direct messages
    if (!cleanPhone.endsWith('@c.us')) {
        cleanPhone = `${cleanPhone}@c.us`;
    }

    return cleanPhone;
}

/**
 * Build the base API URL for this session
 * Pattern: /api/sessions/{sessionId}
 */
function sessionUrl(): string {
    return `${OPENWA_BASE_URL}/api/sessions/${OPENWA_SESSION}`;
}

/**
 * Get authorization headers
 */
function getHeaders() {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
    if (OPENWA_API_KEY) {
        headers['Authorization'] = `Bearer ${OPENWA_API_KEY}`;
    }
    return headers;
}

/**
 * Delay execution for a random number of seconds between min and max.
 */
export function sleepRandom(minSeconds: number, maxSeconds: number): Promise<void> {
    const ms = Math.floor((Math.random() * (maxSeconds - minSeconds) + minSeconds) * 1000);
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if a phone number exists on WhatsApp.
 * GET /api/sessions/{sessionId}/contacts/check/{number}
 */
export async function onWhatsApp(phone: string): Promise<boolean> {
    const cleanPhone = formatPhone(phone);
    // Extract just the number part (without @c.us) for the URL
    const numberOnly = cleanPhone.replace('@c.us', '');

    try {
        const url = `${sessionUrl()}/contacts/check/${numberOnly}`;

        const response = await axios.get(url, {
            headers: getHeaders(),
            timeout: 10000
        });

        const data = response.data;
        // Expect something like { numberExists: true } or { exists: true }
        if (data && typeof data.numberExists === 'boolean') return data.numberExists;
        if (data && typeof data.exists === 'boolean') return data.exists;
        if (data && typeof data.canReceiveMessage === 'boolean') return data.canReceiveMessage;

        return true; // Assume valid if structure is unknown
    } catch (error) {
        console.error("[OpenWA] check-number error:", error instanceof Error ? error.message : error);
        return true; // Don't block users when API is unreachable
    }
}

/**
 * Simulate human typing delay (local delay only — no typing API call).
 */
export async function simulateHumanTyping(phone: string, messageLength: number): Promise<void> {
    const totalDelaySec = Math.max(3, Math.min(12, Math.floor(messageLength / 20)));

    if (totalDelaySec > 5) {
        await sleepRandom(2, 4);
        await sleepRandom(1, 2);
        await sleepRandom(totalDelaySec - 4, totalDelaySec - 2);
    } else {
        await sleepRandom(totalDelaySec, totalDelaySec + 1);
    }
    await sleepRandom(0.5, 1);
}

// Keep sendChatState as a no-op for backward compatibility
export async function sendChatState(_phone: string, _isTyping: boolean): Promise<void> {
    // No typing endpoint available in this server — delay-only simulation
}

/**
 * Send a WhatsApp text message.
 * POST /api/sessions/{sessionId}/messages/send-text
 * Body: { chatId: "number@c.us", text: "message" }
 * Response 201: { messageId: "...", timestamp: ... }
 */
export async function sendWhatsAppMessage(phone: string, message: string) {
    const chatId = formatPhone(phone);

    try {
        const url = `${sessionUrl()}/messages/send-text`;

        const response = await axios.post(
            url,
            {
                chatId,
                text: message
            },
            { headers: getHeaders(), timeout: 15000 }
        );

        return {
            success: true,
            data: response.data,
            messageId: response.data?.messageId || null
        };
    } catch (error: any) {
        let errorMessage = "فشل في إرسال رسالة واتساب";

        if (axios.isAxiosError(error)) {
            if (error.response) {
                errorMessage = `Server Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
                console.error("[OpenWA] send-text error response:", error.response.data);
            } else if (error.request) {
                errorMessage = "No response from OpenWA server. Is it running?";
                console.error("[OpenWA] send-text network error:", error.message);
            }
        }

        return { success: false, error: errorMessage };
    }
}

/**
 * Send a WhatsApp document/file.
 * POST /api/sessions/{sessionId}/messages/send-document
 * (Falls back to send-image for image files)
 */
export async function sendWhatsAppFile(phone: string, base64: string, fileName: string, caption?: string) {
    const chatId = formatPhone(phone);

    try {
        const extension = fileName.split('.').pop()?.toLowerCase() || '';
        let mimeType = 'application/octet-stream';
        if (extension === 'pdf') mimeType = 'application/pdf';
        if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension)) {
            mimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
        }

        // Ensure proper data URL format
        let dataUrl = base64;
        if (!base64.startsWith('data:')) {
            dataUrl = `data:${mimeType};base64,${base64}`;
        }

        // Use send-image for image files, send-document for everything else
        const isImage = mimeType.startsWith('image/');
        const endpoint = isImage ? 'send-image' : 'send-document';
        const url = `${sessionUrl()}/messages/${endpoint}`;

        const body: Record<string, any> = {
            chatId,
            caption: caption || ""
        };

        // For images use "image" field, for documents use "document" field
        if (isImage) {
            body.image = dataUrl;
        } else {
            body.document = dataUrl;
            body.filename = fileName;
        }

        const response = await axios.post(
            url,
            body,
            { headers: getHeaders(), timeout: 30000 }
        );

        return {
            success: true,
            data: response.data,
            messageId: response.data?.messageId || null
        };
    } catch (error: any) {
        let errorMessage = "فشل في إرسال المرفق";
        if (axios.isAxiosError(error) && error.response) {
            errorMessage = `Server Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
        }
        console.error("[OpenWA] send-file error:", errorMessage);
        return { success: false, error: errorMessage };
    }
}

/**
 * Simple parser supporting Spintax format (e.g. {word1|word2|word3})
 */
export function parseSpintax(text: string): string {
    const spintaxRegexp = /\{([^{}]+?\|[^{}]+?)\}/g;
    let matches;
    let iterations = 0;
    while ((matches = spintaxRegexp.exec(text)) !== null && iterations < 100) {
        const options = matches[1].split('|');
        const chosen = options[Math.floor(Math.random() * options.length)];
        text = text.replace(matches[0], chosen);
        spintaxRegexp.lastIndex = 0;
        iterations++;
    }
    return text;
}
