import axios from 'axios';

// Get WPPConnect settings from environment variables
const WPP_BASE_URL = process.env.WPP_BASE_URL || "http://localhost:21465";
const WPP_SESSION = process.env.WPP_SESSION || "accreditation3";
const WPP_TOKEN = process.env.WPP_TOKEN;

/**
 * Send a WhatsApp message using WPPConnect server
 * @param phone Phone number without '+' (e.g., 9677XXXXXXXX)
 * @param message The text message to send
 * @returns Result object indicating success or failure
 */
export async function sendWhatsAppMessage(phone: string, message: string) {
    if (!WPP_TOKEN) {
        console.error("WPP_TOKEN is not defined in environment variables");
        return { success: false, error: "Missing WPPConnect Token configuration" };
    }

    // Clean phone number: remove any non-digit characters and leading +
    let cleanPhone = phone.replace(/[^\d]/g, '');

    // Known country codes (most common for this system)
    const KNOWN_COUNTRY_CODES = [
        '967',  // Yemen
        '966',  // Saudi Arabia
        '20',   // Egypt
        '971',  // UAE
        '968',  // Oman
        '965',  // Kuwait
        '974',  // Qatar
        '973',  // Bahrain
        '962',  // Jordan
        '964',  // Iraq
        '963',  // Syria
        '90',   // Turkey
        '249',  // Sudan
        '251',  // Ethiopia
        '252',  // Somalia
        '253',  // Djibouti
    ];

    // Remove leading zero (local format)
    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);

    // Check if the number already has a known country code
    const hasCountryCode = KNOWN_COUNTRY_CODES.some(code => cleanPhone.startsWith(code));

    // Only add 967 (Yemen) if the number looks local (no country code and ≤ 9 digits)
    if (!hasCountryCode && cleanPhone.length <= 9) {
        cleanPhone = '967' + cleanPhone;
    }

    // append @c.us for WhatsApp API
    const waId = `${cleanPhone}@c.us`;

    try {
        const url = `${WPP_BASE_URL}/api/${WPP_SESSION}/send-message`;

        const response = await axios.post(
            url,
            {
                phone: waId,
                message: message,
                isGroup: false,
            },
            {
                headers: {
                    'Authorization': `Bearer ${WPP_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return {
            success: true,
            data: response.data,
            messageId: response.data?.response?.id || null
        };
    } catch (error: any) {
        let errorMessage = "فشل في إرسال رسالة واتساب عبر WPPConnect";

        if (axios.isAxiosError(error)) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                errorMessage = `Server Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
                console.error("WPPConnect Error Response:", error.response.data);
            } else if (error.request) {
                // The request was made but no response was received
                errorMessage = "No response from WPPConnect server. Is it running?";
                console.error("WPPConnect Network Error:", error.message);
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error("WPPConnect Request Setup Error:", error.message);
            }
        } else {
            console.error("WPPConnect Unexpected Error:", error);
        }

        return { success: false, error: errorMessage };
    }
}

/**
 * Send a WhatsApp file using WPPConnect server via Base64
 * @param phone Phone number without '+' (e.g., 9677XXXXXXXX)
 * @param base64 The Base64 string of the file (e.g. data:image/png;base64,iVBORw0KGgo...)
 * @param fileName The name of the file
 * @param caption Optional text to go with the file
 * @returns Result object indicating success or failure
 */
export async function sendWhatsAppFile(phone: string, base64: string, fileName: string, caption?: string) {
    if (!WPP_TOKEN) {
        console.error("WPP_TOKEN is not defined in environment variables");
        return { success: false, error: "Missing WPPConnect Token configuration" };
    }

    let cleanPhone = phone.replace(/[^\d]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
    const KNOWN_COUNTRY_CODES = ['967','966','20','971','968','965','974','973','962','964','963','90','249','251','252','253'];
    const hasCountryCode = KNOWN_COUNTRY_CODES.some(code => cleanPhone.startsWith(code));
    if (!hasCountryCode && cleanPhone.length <= 9) {
        cleanPhone = '967' + cleanPhone;
    }
    const waId = `${cleanPhone}@c.us`;

    try {
        const url = `${WPP_BASE_URL}/api/${WPP_SESSION}/send-file-base64`;

        let cleanedBase64 = base64;
        let mimeType = '';

        // Extract mimetype from base64 but KEEP the Data URI prefix in the base64 string payload!
        // WPPConnect server expects the 'base64' param to be a complete Data URI (data:mimeType;base64,...).
        if (base64.startsWith('data:')) {
            const parts = base64.split(';base64,');
            if (parts.length === 2) {
                mimeType = parts[0].replace('data:', '');
                // Do NOT strip the prefix: cleanedBase64 = base64;
            }
        } else {
            // If it doesn't have the prefix, construct an appropriate one
            const extension = fileName.split('.').pop()?.toLowerCase();
            let predictedMimeType = 'application/octet-stream';
            if (extension === 'pdf') predictedMimeType = 'application/pdf';
            if (['png', 'jpg', 'jpeg', 'gif'].includes(extension || '')) predictedMimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
            
            cleanedBase64 = `data:${predictedMimeType};base64,${base64}`;
        }

        const response = await axios.post(
            url,
            {
                phone: waId,
                base64: cleanedBase64,
                filename: fileName,
                caption: caption || "",
                mimetype: mimeType,
                isGroup: false,
            },
            {
                headers: {
                    'Authorization': `Bearer ${WPP_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return {
            success: true,
            data: response.data,
            messageId: response.data?.response?.id || null
        };
    } catch (error: any) {
        let errorMessage = "فشل في إرسال المرفق عبر WPPConnect";
        if (axios.isAxiosError(error) && error.response) {
            errorMessage = `Server Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
            console.error("WPPConnect File Error Response:", error.response.data);
        }
        return { success: false, error: errorMessage };
    }
}
