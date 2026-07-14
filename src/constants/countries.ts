export interface Country {
    code: string;
    flag: string;
    name: string;
}

export const countries: Country[] = [
    { code: "+966", flag: "🇸🇦", name: "السعودية" },
    { code: "+971", flag: "🇦🇪", name: "الإمارات" },
    { code: "+965", flag: "🇰🇼", name: "الكويت" },
    { code: "+974", flag: "🇶🇦", name: "قطر" },
    { code: "+973", flag: "🇧🇭", name: "البحرين" },
    { code: "+968", flag: "🇴🇲", name: "عُمان" },
    { code: "+20",  flag: "🇪🇬", name: "مصر" },
    { code: "+962", flag: "🇯🇴", name: "الأردن" },
    { code: "+963", flag: "🇸🇾", name: "سوريا" },
    { code: "+964", flag: "🇮🇶", name: "العراق" },
    { code: "+961", flag: "🇱🇧", name: "لبنان" },
    { code: "+970", flag: "🇵🇸", name: "فلسطين" },
    { code: "+967", flag: "🇾🇪", name: "اليمن" },
    { code: "+249", flag: "🇸🇩", name: "السودان" },
    { code: "+218", flag: "🇱🇾", name: "ليبيا" },
    { code: "+216", flag: "🇹🇳", name: "تونس" },
    { code: "+213", flag: "🇩🇿", name: "الجزائر" },
    { code: "+212", flag: "🇲🇦", name: "المغرب" },
    { code: "+222", flag: "🇲🇷", name: "موريتانيا" },
    { code: "+252", flag: "🇸🇴", name: "الصومال" },
    { code: "+253", flag: "🇩🇯", name: "جيبوتي" },
    { code: "+269", flag: "🇰🇲", name: "جزر القمر" },
];
