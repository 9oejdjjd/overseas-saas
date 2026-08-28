import dns from 'dns';
import { promisify } from 'util';

const resolveMxAsync = promisify(dns.resolveMx);

// Common disposable email domains to block
const DISPOSABLE_DOMAINS = new Set([
    'yopmail.com', 'mailinator.com', '10minutemail.com', 'tempmail.com', 'temp-mail.org', 
    'dispostable.com', 'guerrillamail.com', 'maildrop.cc', 'sharklasers.com', 'guerillamailblock.com',
    'guerillamail.net', 'guerillamail.org', 'guerillamail.biz', 'guerillamailco.com', 'guerillamailde.com',
    'tempmailaddress.com', 'getnada.com', 'boun.cr', 'throwawaymail.com', 'mailnesia.com'
]);

// Typo correction map for popular domains
const TYPO_MAP: Record<string, string> = {
    'gamil.com': 'gmail.com',
    'gmaill.com': 'gmail.com',
    'gamil.co': 'gmail.com',
    'gmal.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'yaho.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
    'hotamil.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
};

export interface EmailValidationResult {
    isValid: boolean;
    error?: string;
    suggestion?: string;
}

/**
 * Validates an email address syntax, checks for typos, filters disposable domains,
 * and performs DNS lookup for MX records to verify domain capability of receiving emails.
 */
export async function validateEmail(email: string): Promise<EmailValidationResult> {
    if (!email || typeof email !== 'string') {
        return { isValid: false, error: 'البريد الإلكتروني فارغ أو غير صحيح' };
    }

    const cleanEmail = email.trim().toLowerCase();
    
    // 1. Basic format verification (Regex)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
        return { isValid: false, error: 'صيغة البريد الإلكتروني غير صالحة' };
    }

    const parts = cleanEmail.split('@');
    if (parts.length !== 2) {
        return { isValid: false, error: 'صيغة البريد الإلكتروني غير صالحة' };
    }
    const domain = parts[1];

    // 2. Typo correction check
    if (TYPO_MAP[domain]) {
        return { 
            isValid: false, 
            error: `يبدو أنك كتبت النطاق بشكل خاطئ. هل تقصد ${TYPO_MAP[domain]}؟`,
            suggestion: `${parts[0]}@${TYPO_MAP[domain]}`
        };
    }

    // 3. Block Disposable Emails
    if (DISPOSABLE_DOMAINS.has(domain)) {
        return { isValid: false, error: 'غير مسموح باستخدام نطاقات البريد المؤقتة أو الوهمية' };
    }

    // 4. DNS MX Records Check (soft fail on network errors)
    try {
        const mxRecords = await resolveMxAsync(domain);
        if (!mxRecords || mxRecords.length === 0) {
            return { isValid: false, error: 'نطاق البريد الإلكتروني المدخل لا يحتوي على خوادم استقبال رسائل (MX Records)' };
        }
    } catch (err: any) {
        // If DNS itself is unreachable (network issue), allow the email through
        const isNetworkError = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN', 'ENETUNREACH'].includes(err?.code);
        if (isNetworkError) {
            console.warn(`[Email Validation] DNS lookup failed due to network issue for ${domain} (${err?.code}), allowing email through.`);
            return { isValid: true };
        }
        // Only reject if the domain definitively doesn't exist (ENODATA, ENOTFOUND for the domain itself)
        console.warn(`[Email Validation] MX resolve failed for domain ${domain}:`, err);
        return { isValid: false, error: 'عنوان البريد الإلكتروني غير صالح أو غير موجود على الإنترنت' };
    }

    return { isValid: true };
}
