import axios from 'axios';

// Get Evolution API settings from environment variables
const EVOLUTION_BASE_URL = process.env.EVOLUTION_BASE_URL || "http://localhost:8080";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || "etemad-pro";

// Helper to format phone number to Evolution API format
function formatPhone(phone: string): string {
    let cleanPhone = phone.replace(/[^\d]/g, '');
    
    // Remove leading zero (local format)
    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
    
    // Known country codes (most common for this system)
    const KNOWN_COUNTRY_CODES = [
        '967', '966', '20', '971', '968', '965', '974', '973', 
        '962', '964', '963', '90', '249', '251', '252', '253'
    ];
    
    const hasCountryCode = KNOWN_COUNTRY_CODES.some(code => cleanPhone.startsWith(code));
    
    // Only add 967 (Yemen) if the number looks local (no country code and <= 9 digits)
    if (!hasCountryCode && cleanPhone.length <= 9) {
        cleanPhone = '967' + cleanPhone;
    }
    
    return cleanPhone;
}

/**
 * Send a WhatsApp message using Evolution API
 * @param phone Phone number without '+' (e.g., 9677XXXXXXXX)
 * @param message The text message to send
 * @returns Result object indicating success or failure
 */
export async function sendWhatsAppMessage(phone: string, message: string) {
    if (!EVOLUTION_API_KEY) {
        console.error("EVOLUTION_API_KEY is not defined in environment variables");
        return { success: false, error: "Missing Evolution API Key configuration" };
    }

    const cleanPhone = formatPhone(phone);

    try {
        const url = `${EVOLUTION_BASE_URL}/message/sendText/${EVOLUTION_INSTANCE}`;
        
        const response = await axios.post(
            url,
            {
                number: cleanPhone,
                text: message,
            },
            {
                headers: {
                    'apikey': EVOLUTION_API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        return {
            success: true,
            data: response.data,
            messageId: response.data?.key?.id || null
        };
    } catch (error: any) {
        let errorMessage = "فشل في إرسال رسالة واتساب عبر Evolution API";
        
        if (axios.isAxiosError(error)) {
            if (error.response) {
                errorMessage = `Server Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
                console.error("Evolution API Error Response:", error.response.data);
            } else if (error.request) {
                errorMessage = "No response from Evolution API server. Is it running?";
                console.error("Evolution API Network Error:", error.message);
            } else {
                console.error("Evolution Request Setup Error:", error.message);
            }
        } else {
            console.error("Evolution API Unexpected Error:", error);
        }

        return { success: false, error: errorMessage };
    }
}

/**
 * Send a WhatsApp file using Evolution API via Base64
 * @param phone Phone number without '+' (e.g., 9677XXXXXXXX)
 * @param base64 The Base64 string of the file
 * @param fileName The name of the file
 * @param caption Optional text to go with the file
 * @returns Result object indicating success or failure
 */
export async function sendWhatsAppFile(phone: string, base64: string, fileName: string, caption?: string) {
    if (!EVOLUTION_API_KEY) {
        console.error("EVOLUTION_API_KEY is not defined in environment variables");
        return { success: false, error: "Missing Evolution API Key configuration" };
    }

    const cleanPhone = formatPhone(phone);

    try {
        const url = `${EVOLUTION_BASE_URL}/message/sendMedia/${EVOLUTION_INSTANCE}`;
        
        let cleanedBase64 = base64;
        let predictedMimeType = 'application/octet-stream';

        // Extract mime type and purely base64 string if data URI is provided
        if (base64.startsWith('data:')) {
            const parts = base64.split(';base64,');
            if (parts.length === 2) {
                predictedMimeType = parts[0].replace('data:', '');
                cleanedBase64 = parts[1];
            }
        } else {
            const extension = fileName.split('.').pop()?.toLowerCase();
            if (extension === 'pdf') predictedMimeType = 'application/pdf';
            if (['png', 'jpg', 'jpeg', 'gif'].includes(extension || '')) {
                predictedMimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
            }
        }

        // Determine generalized media type for Evolution
        const mediatype = predictedMimeType.startsWith("image/") ? "image" : "document";

        const response = await axios.post(
            url,
            {
                number: cleanPhone,
                mediatype: mediatype,
                mimetype: predictedMimeType,
                caption: caption || "",
                media: cleanedBase64,  // Evolution API accepts pure base64 here if mimetype is supplied
                fileName: fileName
            },
            {
                headers: {
                    'apikey': EVOLUTION_API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        return {
            success: true,
            data: response.data,
            messageId: response.data?.key?.id || null
        };
    } catch (error: any) {
        let errorMessage = "فشل في إرسال المرفق عبر Evolution API";
        if (axios.isAxiosError(error) && error.response) {
            errorMessage = `Server Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
            console.error("Evolution API File Error Response:", error.response.data);
        } else {
            console.error("Evolution file send error:", error);
        }
        return { success: false, error: errorMessage };
    }
}
/**
 * Check if a number is on WhatsApp using Evolution API
 * @param phone Phone number (e.g., 9677XXXXXXXX)
 * @returns boolean indicating if the number is registered on WhatsApp
 */
export async function onWhatsApp(phone: string): Promise<boolean> {
    if (!EVOLUTION_API_KEY) return true; // Fallback if not configured

    const cleanPhone = formatPhone(phone);

    try {
        const url = `${EVOLUTION_BASE_URL}/chat/whatsappNumbers/${EVOLUTION_INSTANCE}`;
        
        const response = await axios.post(
            url,
            {
                numbers: [cleanPhone]
            },
            {
                headers: {
                    'apikey': EVOLUTION_API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Evolution API returns an array of objects for checked numbers
        const result = response.data?.[0];
        return result?.exists || false;
    } catch (error) {
        console.error("Evolution onWhatsApp Check Error:", error);
        return true; // Fallback to avoid blocking users if API is down
    }
}
