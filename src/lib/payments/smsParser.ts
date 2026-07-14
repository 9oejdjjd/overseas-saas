/**
 * SMS Parsing Engine for Yemeni Electronic Wallets
 * Tailored regular expressions to extract amount and transaction reference numbers from SMS.
 */

interface ParsedSms {
    amount: number | null;
    transactionNumber: string | null;
    walletName: string;
}

interface WalletTemplate {
    name: string;
    senderKeywords: string[];
    amountRegex: RegExp[];
    transactionRegex: RegExp[];
}

// Highly modular and robust regex templates for Yemeni wallets
const walletTemplates: WalletTemplate[] = [
    {
        name: "الكريمي (أم فلوس)",
        senderKeywords: ["kuraimi", "al-kuraimi", "الكريمي", "ام فلوس", "m-floos", "mfloos"],
        amountRegex: [
            /مبلغ\s*([\d,]+(?:\.\d+)?)\s*ريال/i,
            /استلام\s*([\d,]+(?:\.\d+)?)\s*YER/i,
            /مبلغ\s*([\d,]+(?:\.\d+)?)\s*YER/i,
            /حوالة بمبلغ\s*([\d,]+(?:\.\d+)?)/i
        ],
        transactionRegex: [
            /رقم العملية\s*:\s*(\d+)/i,
            /رقم العملية\s*(\d+)/i,
            /رقم الحركة\s*(\d+)/i,
            /عملية رقم\s*(\d+)/i,
            /العملية\s*(\d+)/i
        ]
    },
    {
        name: "ون كاش (One Cash)",
        senderKeywords: ["onecash", "one-cash", "ون كاش", "ونكاش"],
        amountRegex: [
            /استلام مبلغ\s*([\d,]+(?:\.\d+)?)/i,
            /تحويل مبلغ\s*([\d,]+(?:\.\d+)?)\s*YER/i,
            /مبلغ\s*([\d,]+(?:\.\d+)?)\s*ريال/i,
            /إيداع\s*([\d,]+(?:\.\d+)?)\s*YER/i
        ],
        transactionRegex: [
            /رقم مرجع العملية\s*:\s*(\d+)/i,
            /رقم مرجع العملية\s*(\d+)/i,
            /رقم العملية\s*(\d+)/i,
            /المرجع\s*(\d+)/i
        ]
    },
    {
        name: "جوال بي (Jawwal Pay)",
        senderKeywords: ["jawwalpay", "jawwal-pay", "جوال بي", "جوالبي", "weyon"],
        amountRegex: [
            /إيداع مبلغ\s*([\d,]+(?:\.\d+)?)/i,
            /مبلغ\s*([\d,]+(?:\.\d+)?)\s*YER/i,
            /تحويل\s*([\d,]+(?:\.\d+)?)\s*ريال/i
        ],
        transactionRegex: [
            /رقم العملية\s*:\s*(\d+)/i,
            /رقم العملية\s*(\d+)/i,
            /الحركة\s*(\d+)/i,
            /المرجع\s*(\d+)/i
        ]
    }
];

export function parseSms(body: string, sender: string): ParsedSms {
    const cleanBody = body.trim();
    const cleanSender = sender.trim().toLowerCase();

    // 1. Identify which wallet template matches based on the sender name
    let matchedTemplate = walletTemplates.find(template => 
        template.senderKeywords.some(keyword => cleanSender.includes(keyword) || keyword.includes(cleanSender))
    );

    // Fallback: If sender is not recognized (e.g. normal phone number forwarding), search body contents
    if (!matchedTemplate) {
        matchedTemplate = walletTemplates.find(template => 
            template.senderKeywords.some(keyword => cleanBody.toLowerCase().includes(keyword))
        );
    }

    // Default return structure if completely unmatched
    const result: ParsedSms = {
        amount: null,
        transactionNumber: null,
        walletName: matchedTemplate ? matchedTemplate.name : "محفظة غير معروفة"
    };

    // Use identified template or general patterns to extract data
    const templatesToTry = matchedTemplate ? [matchedTemplate] : walletTemplates;

    // 2. Extract Amount
    for (const template of templatesToTry) {
        for (const regex of template.amountRegex) {
            const match = cleanBody.match(regex);
            if (match && match[1]) {
                // Remove commas from format e.g. "25,000.00" -> "25000.00"
                const parsedVal = parseFloat(match[1].replace(/,/g, ""));
                if (!isNaN(parsedVal)) {
                    result.amount = parsedVal;
                    break;
                }
            }
        }
        if (result.amount !== null) break;
    }

    // 3. Extract Transaction Reference Number
    for (const template of templatesToTry) {
        for (const regex of template.transactionRegex) {
            const match = cleanBody.match(regex);
            if (match && match[1]) {
                result.transactionNumber = match[1].trim();
                break;
            }
        }
        if (result.transactionNumber !== null) break;
    }

    // If still not matched, perform a last-resort generic regex parse for digit sequences
    if (!result.transactionNumber) {
        // Look for 7 to 10 digit numbers which are typical for Yemeni transaction references
        const genericTxMatch = cleanBody.match(/(?:رقم|العملية|حركة|مرجع|المرجع|code|ref|tx|refid)[:\s]+(\d{6,10})/i);
        if (genericTxMatch && genericTxMatch[1]) {
            result.transactionNumber = genericTxMatch[1];
        }
    }

    return result;
}
