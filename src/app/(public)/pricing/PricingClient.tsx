"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Sparkles, HelpCircle, MessageCircle, ArrowLeft, ShieldCheck, Zap, Building, Car, CheckCircle2, ChevronDown, Crown, Star, Gem, Rocket, Gift, MapPin } from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/mock/LandingComponents";
import { SITE_CONFIG } from "@/config/site";

type Category = "exams" | "registration" | "transport";

const ICONS_MAP: Record<string, any> = {
    shield: ShieldCheck,
    zap: Zap,
    building: Building,
    crown: Crown,
    star: Star,
    diamond: Gem,
    rocket: Rocket,
    gift: Gift
};

const EXAMS_ONLY_FEATURES = [
    "اختبارات تجريبية غير محدودة لجميع المهن",
    "أسئلة محدثة مطابقة تماماً للمهنة المطلوبة",
    "تقرير نجاح/رسوب فوري بالتفصيل والدرجات",
    "مراجعة إجابات وتوضيح مواضع الأخطاء",
    "مراجعة كاملة لجميع الأخطاء مع شروحات علمية",
    "تقرير أداء مفصل مرسل فورياً على الواتساب",
    "تقرير أداء مفصل فوري على الواتساب الخاص بك",
    "دعم فني أساسي عبر البريد الإلكتروني",
    "دعم فني مباشر وسريع عبر الواتساب",
    "دعم فني مباشر وسريع جداً عبر الواتساب على مدار الساعة",
    "ضمان النجاح (إعادة الاختبار التجريبي مجاناً)"
];

const REGISTRATION_FEATURES = [
    "إتمام إجراءات التسجيل كاملة في البوابة الرسمية",
    "تسجيل فوري ومكتمل 100% مع مراجعة دقيقة للمستندات",
    "حجز وتأكيد موعد الاختبار في أقرب مركز معتمد",
    "حجز الموعد الأسرع والأقرب جغرافياً لمركز إقامتك",
    "متابعة مستمرة للطلب حتى صدور الموعد والاعتماد",
    "دعم فني استباقي عبر الواتساب لحل أي عقبات تقنية",
    "ضمان اجتياز الاختبار الفعلي (إعادة حجز وتأهيل مجاني)"
];

const TRANSPORT_B2B_FEATURES = [
    "نقل وتأمين مواصلات لمركز الاختبار (ذهاب وعودة مشتركة)",
    "مواصلات VIP خاصة (ذهاباً وإياباً) من مكان إقامتك شاملة الضيافة",
    "مرافق شخصي معتمد من فريقنا لتسهيل كافة إجراءات المركز والدخول",
    "لوحة تحكم مركزية للشركات ومكاتب الاستقدام",
    "لوحة تحكم إشرافية متعددة الموظفين",
    "مدير حساب مخصص لمتابعة أداء مجموعات العمالة",
    "جدولة مواعيد موحدة وحسومات استثنائية للشركات"
];


export default function PricingClient() {
    const [category, setCategory] = useState<Category>("exams");
    const [activeFaq, setActiveFaq] = useState<number | null>(0);
    const [dbPackages, setDbPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Dynamic pricing data states
    const [locations, setLocations] = useState<any[]>([]);
    const [serviceConfig, setServiceConfig] = useState<any>(null);
    const [routes, setRoutes] = useState<any[]>([]);
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [selectedOriginId, setSelectedOriginId] = useState<string>("");
    const [selectedDestinationId, setSelectedDestinationId] = useState<string>("");

    // Fetch dynamic mock packages and transport route details from the database
    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [pkgRes, locRes, configRes, routesRes, currenciesRes] = await Promise.all([
                    fetch("/api/pricing/mock-packages"),
                    fetch("/api/locations"),
                    fetch("/api/pricing/config"),
                    fetch("/api/pricing/routes"),
                    fetch("/api/pricing/currencies")
                ]);

                if (pkgRes.ok) setDbPackages(await pkgRes.json());
                if (locRes.ok) setLocations(await locRes.json());
                if (configRes.ok) setServiceConfig(await configRes.json());
                if (routesRes.ok) setRoutes(await routesRes.json());
                if (currenciesRes.ok) setCurrencies(await currenciesRes.json());
            } catch (error) {
                console.error("Error fetching pricing and route data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    // Categories details
    const categories = [
        { id: "exams" as Category, title: "اختبارات تجريبية فقط", subtitle: "تدريب ذكي ومحاكاة دقيقة" },
        { id: "registration" as Category, title: "التسجيل والاختبارات", subtitle: "تسجيل رسمي وحجز متكامل" },
        { id: "transport" as Category, title: "التسجيل واختبارات ومواصلات", subtitle: "باقة النقل والتأهيل الشامل" },
    ];

    // Gorgeous Fallback Retail Plans if the Database is Empty (ensures visual excellence always)
    const getFallbackRetailPlans = (cat: Category) => {
        switch (cat) {
            case "exams":
                return [
                    {
                        id: "basic-exams",
                        name: "الباقة الأساسية",
                        desc: "مثالية للمتقدمين الراغبين في تجربة الاستعداد الأولي والتقييم الذاتي السريع.",
                        price: 59,
                        priceSAR: 59,
                        priceYER: 118000,
                        icon: ShieldCheck,
                        color: "#475569",
                        borderColor: "border-slate-200/80",
                        bgHighlight: "bg-white",
                        isFeatured: false,
                        isFallback: true,
                        buttonText: "ابدأ التدريب الآن",
                        buttonClass: "w-full py-4 h-13 rounded-2xl text-sm font-black flex items-center justify-center gap-2 border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all active:scale-98",
                        features: [
                            "5 اختبارات تجريبية محاكية للاعتماد المهني",
                            "أسئلة محدثة مطابقة تماماً للمهنة المطلوبة",
                            "تقرير نجاح/رسوب فوري بالتفصيل والدرجات",
                            "دعم فني أساسي عبر البريد الإلكتروني",
                        ],
                        notIncluded: [
                            "مراجعة إجابات وتوضيح مواضع الأخطاء",
                            "تقرير أداء مفصل مرسل فورياً على الواتساب",
                            "دعم فني مباشر وسريع عبر الواتساب",
                        ]
                    },
                    {
                        id: "pro-exams",
                        name: "الباقة الاحترافية",
                        desc: "الخيار الأفضل والموصى به للتأهيل الشامل وضمان النجاح من أول محاولة.",
                        price: 119,
                        priceSAR: 119,
                        priceYER: 238000,
                        icon: Zap,
                        color: "#5c9e45",
                        borderColor: "border-emerald-500/30 shadow-[0_20px_50px_rgba(92,158,69,0.12)]",
                        bgHighlight: "bg-gradient-to-br from-[#122e17] via-[#1b3d22] to-slate-950 text-white",
                        isFeatured: true,
                        recommended: true,
                        isFallback: true,
                        buttonText: "اشترك الآن واضمن نجاحك",
                        buttonClass: "w-full py-4 h-13 rounded-2xl text-sm font-black flex items-center justify-center gap-2 bg-gradient-to-r from-[#16539a] to-[#5c9e45] text-white hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-350 active:scale-98",
                        features: [
                            "اختبارات تجريبية غير محدودة لجميع المهن",
                            "مراجعة كاملة لجميع الأخطاء مع شروحات علمية",
                            "تقرير أداء مفصل فوري على الواتساب الخاص بك",
                            "دعم فني مباشر وسريع جداً عبر الواتساب على مدار الساعة",
                        ],
                        notIncluded: [
                            "لوحة تحكم مركزية للشركات ومكاتب الاستقدام",
                            "مدير حساب مخصص لمتابعة أداء مجموعات العمالة"
                        ]
                    }
                ];
            case "registration":
                return [
                    {
                        id: "basic-reg",
                        name: "الباقة الأساسية",
                        desc: "تسجيل موثوق للمتقدمين الأفراد مع باقة التدريبات الأساسية المحاكية.",
                        price: 199,
                        priceSAR: 199,
                        priceYER: 398000,
                        icon: ShieldCheck,
                        color: "#475569",
                        borderColor: "border-slate-200/80",
                        bgHighlight: "bg-white",
                        isFeatured: false,
                        isFallback: true,
                        buttonText: "سجل الآن",
                        buttonClass: "w-full py-4 h-13 rounded-2xl text-sm font-black flex items-center justify-center gap-2 border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all active:scale-98",
                        features: [
                            "إتمام إجراءات التسجيل كاملة في البوابة الرسمية",
                            "5 اختبارات تجريبية محاكية مجاناً للاستعداد",
                            "حجز وتأكيد موعد الاختبار في أقرب مركز معتمد",
                            "متابعة مستمرة للطلب حتى صدور الموعد والاعتماد",
                        ],
                        notIncluded: [
                            "اختبارات تجريبية غير محدودة وتوضيح الأخطاء",
                            "تعديل موعد الاختبار بعد تأكيده مجاناً",
                            "أولوية التسجيل الفوري في الحالات العاجلة",
                        ]
                    },
                    {
                        id: "pro-reg",
                        name: "الباقة الاحترافية",
                        desc: "الباقة الذهبية المتكاملة لإنجاز التسجيل فورا وحجز الموعد مع ضمان النجاح الكامل.",
                        price: 299,
                        priceSAR: 299,
                        priceYER: 598000,
                        icon: Zap,
                        color: "#5c9e45",
                        borderColor: "border-emerald-500/30 shadow-[0_20px_50px_rgba(92,158,69,0.12)]",
                        bgHighlight: "bg-gradient-to-br from-[#122e17] via-[#1b3d22] to-slate-950 text-white",
                        isFeatured: true,
                        recommended: true,
                        isFallback: true,
                        buttonText: "سجل فورياً مع ضمان النجاح",
                        buttonClass: "w-full py-4 h-13 rounded-2xl text-sm font-black flex items-center justify-center gap-2 bg-gradient-to-r from-[#16539a] to-[#5c9e45] text-white hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-350 active:scale-98",
                        features: [
                            "تسجيل فوري ومكتمل 100% مع مراجعة دقيقة للمستندات",
                            "اختبارات تجريبية غير محدودة مع شروحات علمية مفصلة",
                            "حجز الموعد الأسرع والأقرب جغرافياً لمركز إقامتك",
                            "دعم فني استباقي عبر الواتساب لحل أي عقبات تقنية",
                        ],
                        notIncluded: [
                            "لوحة تحكم إشرافية متعددة الموظفين",
                            "جدولة مواعيد موحدة وحسومات استثنائية للشركات"
                        ]
                    }
                ];
            case "transport":
                return [
                    {
                        id: "basic-trans",
                        name: "الباقة الأساسية",
                        desc: "الحل الاقتصادي للتسجيل وحجز الموعد مع تأمين المواصلات الأساسية لمركز الفحص.",
                        price: 299,
                        priceSAR: 299,
                        priceYER: 598000,
                        icon: ShieldCheck,
                        color: "#475569",
                        borderColor: "border-slate-200/80",
                        bgHighlight: "bg-white",
                        isFeatured: false,
                        isFallback: true,
                        buttonText: "احجز الآن",
                        buttonClass: "w-full py-4 h-13 rounded-2xl text-sm font-black flex items-center justify-center gap-2 border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all active:scale-98",
                        features: [
                            "إتمام إجراءات التسجيل وحجز الموعد في المركز الرسمي",
                            "5 اختبارات تجريبية محاكية للاعتماد والاستعداد الذاتي",
                            "نقل وتأمين مواصلات لمركز الاختبار (ذهاب وعودة مشتركة)",
                            "دعم وتنسيق أساسي وتأكيد تفاصيل رحلة الانطلاق",
                        ],
                        notIncluded: [
                            "مواصلات VIP فردية مخصصة ومريحة",
                            "مرافق شخصي لتسريع إجراءات الدخول بالمركز",
                            "اختبارات تجريبية مفتوحة وغير محدودة",
                        ]
                    },
                    {
                        id: "pro-trans",
                        name: "الباقة الاحترافية",
                        desc: "باقة كبار الشخصيات المتكاملة: تسجيل وحجز واختبارات مفتوحة ومواصلات VIP مريحة مع مرافق.",
                        price: 399,
                        priceSAR: 399,
                        priceYER: 798000,
                        icon: Zap,
                        color: "#5c9e45",
                        borderColor: "border-emerald-500/30 shadow-[0_20px_50px_rgba(92,158,69,0.12)]",
                        bgHighlight: "bg-gradient-to-br from-[#122e17] via-[#1b3d22] to-slate-950 text-white",
                        isFeatured: true,
                        recommended: true,
                        isFallback: true,
                        buttonText: "احجز باقة VIP الشاملة",
                        buttonClass: "w-full py-4 h-13 rounded-2xl text-sm font-black flex items-center justify-center gap-2 bg-gradient-to-r from-[#16539a] to-[#5c9e45] text-white hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-350 active:scale-98",
                        features: [
                            "تسجيل احترافي فوري وحجز مواعيد مرنة وسريعة جداً",
                            "اختبارات تجريبية غير محدودة ومراجعة شاملة للأخطاء",
                            "مواصلات VIP خاصة (ذهاباً وإياباً) من مكان إقامتك شاملة الضيافة",
                            "مرافق شخصي معتمد من فريقنا لتسهيل كافة إجراءات المركز والدخول",
                        ],
                        notIncluded: [
                            "إمكانية حجز حافلات نقل جماعي ضخمة للمجموعات الكبيرة",
                            "لوحة تحكم إحصائية مركزية للشركات لمراقبة الأساطيل"
                        ]
                    }
                ];
        }
    };

    // B2B Plan Card appended dynamically to the end of the lists
    const getB2BPlanCard = (cat: Category) => {
        switch (cat) {
            case "exams":
                return {
                    name: "باقة قطاع الأعمال والشركات",
                    desc: "حلول متكاملة ومخصصة لمكاتب الاستقدام وممثلي الموارد البشرية لتأهيل العمالة.",
                    price: null,
                    priceSAR: 0,
                    priceYER: 0,
                    icon: Building,
                    color: "#16539a",
                    borderColor: "border-slate-200/80 shadow-md shadow-slate-100/40 bg-white",
                    bgHighlight: "bg-white",
                    isFeatured: false,
                    isFallback: false,
                    buttonText: "طلب عرض أسعار مخصص",
                    buttonClass: "w-full py-4 h-13 rounded-2xl text-sm font-black flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800 transition-all active:scale-98",
                    features: [
                        "تأهيل جماعي لمجموعات العمالة وتوفير حسابات متعددة",
                        "لوحة تحكم خاصة بالشركة لمتابعة أداء ونتائج الموظفين",
                        "تقارير دورية وإحصائيات النجاح للعمالة",
                        "مدير حساب مخصص وتفعيل فوري للخدمات",
                        "أسعار مرنة وحسومات مميزة بناء على عدد العمالة",
                    ],
                    notIncluded: []
                };
            case "registration":
                return {
                    name: "باقة قطاع الأعمال والشركات",
                    desc: "إدارة وتسجيل وتأهيل جماعي لكامل موظفي وعمالة شركتك أو مكتبك بأعلى سرعة.",
                    price: null,
                    priceSAR: 0,
                    priceYER: 0,
                    icon: Building,
                    color: "#16539a",
                    borderColor: "border-slate-200/80 shadow-md shadow-slate-100/40 bg-white",
                    bgHighlight: "bg-white",
                    isFeatured: false,
                    isFallback: false,
                    buttonText: "تواصل لمبيعات الشركات",
                    buttonClass: "w-full py-4 h-13 rounded-2xl text-sm font-black flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800 transition-all active:scale-98",
                    features: [
                        "إدارة كاملة لملفات موظفي الشركة وتسجيلهم جماعياً",
                        "حجز وتنسيق مواعيد الاختبارات للمجموعات بشكل منسق",
                        "لوحة تحكم خاصة بالمشرف لمتابعة حالة اختبار واعتماد العمالة",
                        "خط ساخن مباشر مع مدير الحساب المخصص لحل أي إشكالات",
                        "خصومات تصاعدية استثنائية وعقود فوترة مرنة للشركات",
                    ],
                    notIncluded: []
                };
            case "transport":
                return {
                    name: "باقة قطاع الأعمال والشركات",
                    desc: "حلول أساطيل النقل الجماعي والتسجيل الموحد للشركات ومكاتب الاستقدام الكبرى.",
                    price: null,
                    priceSAR: 0,
                    priceYER: 0,
                    icon: Building,
                    color: "#16539a",
                    borderColor: "border-slate-200/80 shadow-md shadow-slate-100/40 bg-white",
                    bgHighlight: "bg-white",
                    isFeatured: false,
                    isFallback: false,
                    buttonText: "طلب تسعير أساطيل النقل",
                    buttonClass: "w-full py-4 h-13 rounded-2xl text-sm font-black flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800 transition-all active:scale-98",
                    features: [
                        "تسجيل جماعي موحد وحجز وتنسيق مواعيد اختبارات متزامنة",
                        "توفير حافلات نقل جماعي حديثة ومكيفة لنقل المجموعات دفعة واحدة",
                        "مشرف ومرافق ميداني مخصص للشركة لإدارة إجراءات عمالتكم بيوم الاختبار",
                        "لوحة تحكم لمراقبة حالة التسجيل، مواعيد النقل، والنتائج النهائية",
                        "أسعار تفضيلية وعقود فوترة وتسهيلات سداد سنوية مريحة",
                    ],
                    notIncluded: []
                };
        }
    };

    const calculateDynamicPrice = (pkg: any) => {
        const sarCurrency = currencies.find(c => c.code === "SAR") || { buyRate: 530.00, sellRate: 533.00 };
        const sarBuyRate = Number(sarCurrency.buyRate) || 530.00;
        const sarSellRate = Number(sarCurrency.sellRate) || 533.00;

        // 1. Base Mock Exam Price
        const examPriceSAR = pkg.priceSAR > 0 ? Number(pkg.priceSAR) : (Number(pkg.examPrice || 0) / sarBuyRate);
        const examPriceYER = pkg.examPrice > 0 ? Number(pkg.examPrice) : (examPriceSAR * sarSellRate);

        // 2. Registration Cost
        const regPriceYER = Number(serviceConfig?.registrationPrice || 16000);
        const registrationCostYER = pkg.includesRegistration 
            ? Math.max(0, regPriceYER - Number(pkg.registrationDiscount || 0)) 
            : 0;
        const registrationCostSAR = registrationCostYER / sarBuyRate;

        // 3. Transport Cost
        let transportPriceYER = 0;
        let transportPriceSAR = 0;
        const originLoc = locations.find(l => l.id === selectedOriginId);
        const destLoc = locations.find(l => l.id === selectedDestinationId);
        if (pkg.includesTransport && originLoc && destLoc) {
            const route = routes.find(r => 
                r.fromDestination?.name === originLoc.name &&
                r.toDestination?.name === destLoc.name
            );
            if (route) {
                const isRoundTrip = pkg.transportType === "ROUND_TRIP";
                const baseRoutePrice = isRoundTrip
                    ? Number(route.roundTripPrice)
                    : Number(route.oneWayPrice);

                if (route.currency === "SAR") {
                    transportPriceSAR = baseRoutePrice;
                    transportPriceYER = baseRoutePrice * sarSellRate;
                } else {
                    transportPriceYER = baseRoutePrice;
                    transportPriceSAR = baseRoutePrice / sarBuyRate;
                }
            }
        }

        const transportDiscountYER = Number(pkg.transportDiscount || 0);
        const transportDiscountSAR = transportDiscountYER / sarBuyRate;

        const transportCostYER = pkg.includesTransport 
            ? Math.max(0, transportPriceYER - transportDiscountYER) 
            : 0;
        const transportCostSAR = pkg.includesTransport 
            ? Math.max(0, transportPriceSAR - transportDiscountSAR) 
            : 0;

        // 4. Final Prices YER & SAR
        const priceSAR = Math.round(examPriceSAR + registrationCostSAR + transportCostSAR);
        const priceYER = Math.round(examPriceYER + registrationCostYER + transportCostYER);

        // 5. Actual Costs YER & SAR
        const actualCostSAR = Math.round(examPriceSAR + (pkg.includesRegistration ? (regPriceYER / sarBuyRate) : 0) + (pkg.includesTransport ? transportPriceSAR : 0));
        const actualCostYER = Math.round(examPriceYER + (pkg.includesRegistration ? regPriceYER : 0) + (pkg.includesTransport ? transportPriceYER : 0));

        return {
            priceYER,
            priceSAR,
            actualCostYER,
            actualCostSAR
        };
    };

    // Combine Database Packages and Fallbacks Dynamically
    const getPlanData = (cat: Category) => {
        // 1. Filter packages from DB for this category
        const filteredDbPackages = dbPackages.filter(pkg => {
            if (!pkg.isActive) return false;
            if (pkg.isFree) return false;
            if (cat === "exams") {
                return !pkg.includesRegistration && !pkg.includesTransport;
            }
            if (cat === "registration") {
                return pkg.includesRegistration && !pkg.includesTransport;
            }
            if (cat === "transport") {
                return pkg.includesRegistration && pkg.includesTransport;
            }
            return false;
        });

        // 2. Map DB packages to plan objects
        const mappedDbPlans = filteredDbPackages.map(pkg => {
            const isFeatured = pkg.isFeatured;
            const { priceYER, priceSAR, actualCostYER, actualCostSAR } = calculateDynamicPrice(pkg);

            const themeColor = pkg.color || (isFeatured ? "#5c9e45" : "#475569");
            const isBlueTheme = themeColor === "#16539a";

            const bgGradientClass = isBlueTheme
                ? "bg-gradient-to-br from-[#0c2340] via-[#0f2e54] to-slate-950 text-white"
                : "bg-gradient-to-br from-[#122e17] via-[#1b3d22] to-slate-950 text-white";

            const borderColor = isFeatured 
                ? isBlueTheme
                    ? `border-blue-500/30 shadow-[0_20px_50px_rgba(22,83,154,0.12)] ${bgGradientClass}`
                    : `border-emerald-500/30 shadow-[0_20px_50px_rgba(92,158,69,0.12)] ${bgGradientClass}` 
                : "border-slate-200/80 shadow-md shadow-slate-100/40 bg-white";

            const buttonClass = isFeatured 
                ? isBlueTheme
                    ? "w-full py-4 h-13 rounded-2xl text-sm font-black flex items-center justify-center gap-2 bg-gradient-to-r from-[#16539a] to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-350 active:scale-98"
                    : "w-full py-4 h-13 rounded-2xl text-sm font-black flex items-center justify-center gap-2 bg-gradient-to-r from-[#16539a] to-[#5c9e45] text-white hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-350 active:scale-98"
                : "w-full py-4 h-13 rounded-2xl text-sm font-black flex items-center justify-center gap-2 border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all active:scale-98";

            // Inject dynamic credits features dynamically!
            const creditFeature = pkg.examCredits === -1 
                ? "محاولات اختبارات تجريبية غير محدودة محاكية للاعتماد المهني"
                : `${pkg.examCredits} اختبارات تجريبية محاكية للاعتماد المهني`;

            const parsedFeatures = Array.isArray(pkg.features) ? pkg.features.map((f: any) => typeof f === 'string' ? { text: f, isIncluded: true } : f) : [];
            const dbIncludedFeatures = parsedFeatures.filter((f: any) => f.isIncluded !== false).map((f: any) => f.text);
            const dbExcludedFeatures = parsedFeatures.filter((f: any) => f.isIncluded === false).map((f: any) => f.text);

            const packageFeatures = [
                creditFeature,
                ...dbIncludedFeatures
            ];

            const notIncludedFeatures = dbExcludedFeatures;

            return {
                id: pkg.id,
                name: pkg.name,
                desc: pkg.description || "",
                price: priceSAR, // primary price in SAR
                priceSAR: priceSAR,
                priceYER: priceYER, // price in YER
                actualCostYER,
                actualCostSAR,
                icon: pkg.icon || (isFeatured ? (isBlueTheme ? "crown" : "zap") : "shield"),
                color: themeColor,
                borderColor,
                bgHighlight: isFeatured 
                    ? bgGradientClass
                    : "bg-white",
                recommended: isFeatured,
                isFallback: false,
                buttonText: isFeatured ? "اشترك الآن واضمن نجاحك" : "ابدأ التدريب الآن",
                buttonClass,
                features: packageFeatures,
                badge: pkg.badge || "",
                notIncluded: notIncludedFeatures
            };
        });

        // 3. If no DB packages, load pre-designed fallbacks
        const retailPlans = mappedDbPlans.length > 0 ? mappedDbPlans : getFallbackRetailPlans(cat);

        return retailPlans;
    };

    const currentPlans = getPlanData(category);

    // Compute ALL active retail packages dynamically for side-by-side corporate comparison
    const getAllActivePlansForComparison = () => {
        const activeDbRetail = dbPackages.filter(p => p.isActive && !p.isFree).map(pkg => {
            const { priceYER, priceSAR } = calculateDynamicPrice(pkg);
            return {
                id: pkg.id,
                name: pkg.name,
                includesRegistration: pkg.includesRegistration,
                includesTransport: pkg.includesTransport,
                examCredits: pkg.examCredits,
                validityDays: pkg.validityDays,
                price: priceSAR,
                priceSAR: priceSAR,
                priceYER: priceYER,
                isFeatured: pkg.isFeatured,
                isFallback: false
            };
        });

        if (activeDbRetail.length > 0) {
            return activeDbRetail;
        }

        // If no packages exist in DB, fallback to presenting our standard presets side-by-side
        return [
            ...getFallbackRetailPlans("exams"),
            ...getFallbackRetailPlans("registration"),
            ...getFallbackRetailPlans("transport")
        ];
    };

    const comparisonPlans = getAllActivePlansForComparison();

    const comparisonRows = [
        {
            name: "رصيد محاولات الاختبار التجريبي",
            getValue: (plan: any) => plan.examCredits === -1 ? "محاولات غير محدودة" : `${plan.examCredits} اختبارات تجريبية`
        },
        {
            name: "رسوم فتح الملف والتسجيل بالبوابة",
            getValue: (plan: any) => plan.includesRegistration ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                    <Check size={10} className="shrink-0" strokeWidth={3} />
                    <span>مشمول</span>
                </span>
            ) : (
                <span className="inline-flex items-center gap-1 text-rose-500 bg-rose-50 border border-rose-100 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                    <X size={10} className="shrink-0" strokeWidth={3} />
                    <span>غير مشمول</span>
                </span>
            )
        },
        {
            name: "تأمين النقل والمواصلات لمركز الفحص",
            getValue: (plan: any) => plan.includesTransport ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                    <Check size={10} className="shrink-0" strokeWidth={3} />
                    <span>مشمول VIP</span>
                </span>
            ) : (
                <span className="inline-flex items-center gap-1 text-rose-500 bg-rose-50 border border-rose-100 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                    <X size={10} className="shrink-0" strokeWidth={3} />
                    <span>غير مشمول</span>
                </span>
            )
        },
        {
            name: "صلاحية الباقة وتنشيط الرصيد",
            getValue: (plan: any) => plan.validityDays ? `${plan.validityDays} يوماً` : "صلاحية مفتوحة أبدية"
        },
        {
            name: "السعر الرسمي بالريال السعودي (SAR)🇸🇦",
            getValue: (plan: any) => plan.priceSAR > 0 ? (
                <span className="font-sans font-black text-slate-800">{plan.priceSAR} ر.س</span>
            ) : (
                <span className="text-emerald-600 font-bold">مجاني بالكامل</span>
            )
        }
    ];

    const faqs = [
        { q: "ما هي الفروقات بين فئات الخدمات الثلاث؟", a: "فئة (اختبارات تجريبية فقط) مخصصة لمن لديه حجز وتسجيل مسبق ويريد التدرب فقط. فئة (التسجيل والاختبارات) تتكفل بالتسجيل الرسمي وحجز الموعد وتأهيلك. فئة (شامل مع مواصلات) تضيف للخدمة السابقة تأمين وسيلة نقل VIP ومرافق ميداني يسهل كافة الإجراءات بيوم اختبارك الفعلي." },
        { q: "كيف تضمنون نجاحي في الاختبار الفعلي؟", a: "من خلال بنوك الأسئلة الفاخرة والمحاكية تماماً لأحدث اختبارات الفحص المهني السعودي. نقوم بتحليل نقاط ضعفك وشرح الأخطاء ومتابعتك حتى نرى جاهزيتك التامة، وفي حال حدوث إخفاق - لا قدر الله - في الباقات الاحترافية، نتكفل بإعادة التسجيل والحجز مجاناً." },
        { q: "هل الأسعار المعلنة تشمل الرسوم الحكومية لمنصة الفحص؟", a: "الأسعار تغطي خدماتنا الاحترافية في التسجيل والاستعداد والمطابقة والمواصلات. الرسوم الحكومية أو رسوم المركز الفعلي يتم إدراجها بشكل منفصل وشفاف حسب المهنة المطلوبة والمركز المحدد." },
        { q: "هل تدعمون مكاتب الاستقدام والشركات التي تمتلك أعداداً كبيرة من العمالة؟", a: "بالتأكيد. نوفر عقود شراكة وتسهيلات كبيرة تشمل لوحات تحكم للمشرفين، ونقلاً جماعياً منظماً، وتنسيقاً شاملاً للمواعيد لتقليل التعطيل وتأكيد اعتماد الموظفين في أسرع وقت. تواصل معنا مباشرة لمناقشة الخصومات." }
    ];

    if (loading) {
        return (
            <main className="min-h-screen pt-32 pb-20 bg-gradient-to-b from-[#f8fafc] via-slate-50 to-white flex items-center justify-center font-sans">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#16539a] border-t-transparent"></div>
                    <p className="text-slate-500 text-xs animate-pulse font-bold">جاري تحميل الباقات والأسعار المحدثة من قاعدة البيانات...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen pt-32 pb-20 bg-gradient-to-b from-[#f8fafc] via-slate-50 to-white font-sans text-slate-800 relative overflow-hidden">
            
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#16539a]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/3 left-0 w-[500px] h-[500px] bg-[#5c9e45]/5 rounded-full blur-[100px] pointer-events-none" />
            
            {/* Header Area */}
            <div className="max-w-6xl mx-auto px-6 text-center mb-16 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100/60 mb-6 shadow-sm"
                >
                    <Sparkles className="w-4 h-4 text-[#5c9e45] animate-pulse" />
                    <span className="text-xs font-black text-[#16539a]">استثمر في مستقبلك واضمن نجاحك بنسبة 100%</span>
                </motion.div>
                
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-6 leading-tight"
                >
                    خيارات تسعير مرنة <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#16539a] to-[#5c9e45]">تلبي متطلباتك بدقة</span>
                </motion.h1>
                
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto mb-12 font-medium leading-relaxed"
                >
                    اختر فئة الخدمة المناسبة لحالتك اليوم، ثم حدد الباقة التي تضمن لك إنجاز كافة معاملاتك الفنية بيسر وسهولة.
                </motion.p>

                {/* Overhauled 3-Option Premium Selector (3-Choice iOS Segmented Control) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="inline-flex flex-col sm:flex-row items-stretch p-2 bg-slate-100 border border-slate-200/60 rounded-[2rem] shadow-inner max-w-4xl w-full mx-auto gap-1 sm:gap-2 relative"
                >
                    {categories.map((cat) => {
                        const isActive = category === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setCategory(cat.id)}
                                className="relative flex-1 py-4 px-6 rounded-[1.6rem] text-right focus:outline-none transition-all duration-300 overflow-hidden flex flex-col justify-center"
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeCategoryBg"
                                        className="absolute inset-0 bg-white border border-slate-200/50 shadow-md rounded-[1.6rem]"
                                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                    />
                                )}
                                <span className={`relative z-10 text-sm font-black transition-colors duration-300 ${
                                    isActive ? "text-[#16539a]" : "text-slate-650 hover:text-slate-900"
                                }`}>
                                    {cat.title}
                                </span>
                                <span className={`relative z-10 text-[10px] mt-1 font-medium transition-colors duration-300 ${
                                    isActive ? "text-[#5c9e45]" : "text-slate-400"
                                }`}>
                                    {cat.subtitle}
                                </span>
                            </button>
                        );
                    })}
                </motion.div>
            </div>

            {/* Plans Cards */}
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-28 items-stretch relative z-10">
                <AnimatePresence mode="wait">
                    {currentPlans.map((plan: any, i) => {
                        const PlanIcon = typeof plan.icon === 'string' 
                            ? (ICONS_MAP[plan.icon.toLowerCase()] || Star) 
                            : plan.icon;
                        
                        return (
                            <motion.div
                                key={`${category}-${plan.name}`}
                                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                                transition={{ duration: 0.4, delay: i * 0.08 }}
                                whileHover={{ y: -8 }}
                                className={`rounded-[2.2rem] border ${plan.borderColor} ${plan.bgHighlight} p-8 flex flex-col justify-between transition-all duration-300 relative overflow-hidden group ${
                                    plan.recommended 
                                        ? 'scale-102 lg:scale-103 shadow-2xl z-10 text-white shadow-slate-950/20' 
                                        : 'shadow-md shadow-slate-100/40 bg-white text-slate-800'
                                }`}
                            >
                                {/* Glowing Ambient elements for Premium/Recommended Plan */}
                                {plan.recommended && (
                                    <>
                                        <div className="absolute top-[-20%] left-[-20%] w-[180px] h-[180px] rounded-full blur-[40px] pointer-events-none" style={{ backgroundColor: `${plan.color || '#5c9e45'}33` }} />
                                        <div className="absolute bottom-[-20%] right-[-20%] w-[200px] h-[200px] rounded-full blur-[50px] pointer-events-none" style={{ backgroundColor: `${plan.color || '#16539a'}33` }} />
                                        <div className="absolute top-5 left-5 px-4 py-1.5 text-white text-[10px] font-black rounded-full shadow-lg flex items-center gap-1.5 z-10"
                                             style={{ backgroundColor: plan.color || '#5c9e45' }}>
                                            <Sparkles size={11} className="animate-spin" /> 
                                            <span>{plan.badge || "الباقة الأكثر طلباً وضماناً"}</span>
                                        </div>
                                    </>
                                )}

                                <div>
                                    {/* Text Header */}
                                    <div className="mb-6">
                                        <h3 className={`text-xl font-extrabold ${plan.recommended ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                                        {plan.recommended && (
                                            <span className="text-[10px] font-bold block mt-1.5" style={{ color: plan.color === '#16539a' ? '#60a5fa' : '#34d399' }}>
                                                ضمان ذهبي معتمد
                                            </span>
                                        )}
                                    </div>

                                    <p className={`text-sm leading-relaxed mb-6 font-medium min-h-[48px] ${
                                        plan.recommended ? 'text-slate-300' : 'text-slate-500'
                                    }`}>{plan.desc}</p>

                                    {/* Dual Currency Pricing (SAR & YER) Fully Implemented! */}
                                    <div className="mb-8">
                                        {plan.price !== null ? (
                                            <div className="flex flex-col gap-2.5 justify-start text-right">
                                                {/* Strike-through and savings for primary SAR currency */}
                                                {plan.actualCostSAR > plan.priceSAR && (
                                                    <div className="flex items-center gap-2 justify-start text-xs font-bold leading-none mb-1 animate-pulse" dir="rtl">
                                                        <span className={`line-through opacity-50 ${plan.recommended ? 'text-slate-400' : 'text-slate-400'}`}>
                                                            {plan.actualCostSAR} ر.س
                                                        </span>
                                                        <span className="bg-rose-500 text-white px-2 py-0.5 text-[9px] font-black rounded-full shadow-sm">
                                                            وفّر {Math.round((1 - plan.priceSAR / plan.actualCostSAR) * 100)}%
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex items-baseline gap-2 justify-start" dir="rtl">
                                                    <span className={`text-5xl font-black tracking-tight ${plan.recommended ? 'text-white' : 'text-slate-900'}`}>
                                                        {plan.price}
                                                    </span>
                                                    <span className={`text-xs font-bold ${plan.recommended ? 'text-slate-400' : 'text-slate-450'}`}>
                                                        ر.س شامل الخدمة
                                                    </span>
                                                </div>
                                                {category === "transport" && (
                                                    <span className={`text-[10px] font-bold block mt-2.5 leading-relaxed text-right ${
                                                        plan.recommended ? 'text-amber-300' : 'text-amber-600'
                                                    }`}>
                                                        ⚠️ هذا السعر يشمل رسوم الباقة والتسجيل فقط. تكاليف المواصلات يتم احتسابها وتضاف للمجموع تلقائياً في الخطوة التالية بحسب مدينتي الإقامة والاختبار.
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className={`text-2xl font-black ${plan.recommended ? 'text-white' : 'text-slate-900'}`}>أسعار تفضيلية مخصصة</div>
                                        )}
                                    </div>

                                    <hr className={`mb-8 ${plan.recommended ? 'border-white/10' : 'border-slate-100'}`} />

                                    {/* Features List */}
                                    <ul className="space-y-4 mb-8">
                                        {plan.features.map((f: string) => (
                                            <li key={f} className="flex items-start gap-3 text-sm font-semibold leading-relaxed">
                                                <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                                    plan.recommended 
                                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                                        : 'bg-green-50 text-[#5c9e45]'
                                                }`}>
                                                    <Check size={12} strokeWidth={3} />
                                                </span>
                                                <span className={plan.recommended ? 'text-slate-200' : 'text-slate-655'}>{f}</span>
                                            </li>
                                        ))}
                                        {plan.notIncluded && plan.notIncluded.map((f: string) => (
                                            <li key={f} className="flex items-start gap-3 text-sm font-medium leading-relaxed opacity-60">
                                                <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                                                    plan.recommended 
                                                        ? 'bg-white/5 text-slate-500 border-white/10' 
                                                        : 'bg-slate-50 text-slate-350 border-slate-100'
                                                }`}>
                                                    <X size={10} strokeWidth={3} />
                                                </span>
                                                <span className={plan.recommended ? 'text-slate-500' : 'text-slate-400'}>{f}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Button CTA */}
                                <div className="mt-auto">
                                    {plan.price !== null ? (
                                        plan.isFallback ? (
                                            <a 
                                                href={`https://wa.me/${SITE_CONFIG.supportWhatsapp}?text=مرحباً، أود الاشتراك في ${plan.name} - باقة ${categories.find(c => c.id === category)?.title}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={plan.buttonClass}
                                            >
                                                {plan.buttonText}
                                                <ArrowLeft size={16} />
                                            </a>
                                        ) : (
                                            <Link 
                                                href={`/checkout/${plan.id}?originId=${selectedOriginId}&destinationId=${selectedDestinationId}`}
                                                className={plan.buttonClass}
                                            >
                                                <span>{plan.buttonText}</span>
                                                <ArrowLeft size={16} />
                                            </Link>
                                        )
                                    ) : (
                                        <a 
                                            href={`https://wa.me/${SITE_CONFIG.supportWhatsapp}?text=مرحباً، أود الاستفسار عن باقة قطاع الأعمال - باقة ${categories.find(c => c.id === category)?.title}`}
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className={plan.buttonClass}
                                        >
                                            {plan.buttonText}
                                            <MessageCircle size={16} />
                                        </a>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Corporate Dynamic Feature Comparison Table */}
            <div className="max-w-6xl mx-auto px-6 mb-28">
                <div className="text-center mb-12">
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-3">مقارنة فئات الخدمات والشمولية</h2>
                    <p className="text-slate-500 text-sm font-bold">مقارنة فنية حية وجدول متكامل لخصائص وأسعار كافة الباقات المتاحة</p>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-[2.2rem] shadow-xl shadow-slate-100/50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-slate-50/70 border-b border-slate-100">
                                    <th className="p-6 font-black text-slate-800 text-sm">الميزة والمواصفات</th>
                                    {comparisonPlans.map((plan: any) => (
                                        <th 
                                            key={plan.id || plan.name} 
                                            className={`p-6 font-bold text-sm text-center ${
                                                plan.isFeatured ? 'text-emerald-700 bg-emerald-500/5' : 'text-slate-700'
                                            }`}
                                        >
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="font-extrabold text-sm">{plan.name}</span>
                                                {plan.isFeatured && (
                                                    <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[8px] font-black rounded-full px-2.5 py-0.5">مميزة</span>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonRows.map((row, idx) => (
                                    <tr key={idx} className="border-b border-slate-100/50 hover:bg-slate-50/30 transition-colors last:border-0">
                                        <td className="p-6 text-sm font-bold text-slate-700">{row.name}</td>
                                        {comparisonPlans.map((plan: any) => (
                                            <td 
                                                key={plan.id || plan.name} 
                                                className={`p-6 text-sm font-bold text-center ${
                                                    plan.isFeatured ? 'bg-emerald-500/[0.015]' : ''
                                                }`}
                                            >
                                                {row.getValue(plan)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Dedicated Corporate / B2B Section */}
            <div className="max-w-6xl mx-auto px-6 mb-28 relative z-10">
                <div className="bg-gradient-to-br from-[#0c2340] via-slate-900 to-slate-950 text-white rounded-[2.5rem] border border-blue-500/20 shadow-2xl p-8 md:p-12 overflow-hidden relative">
                    {/* Background glows */}
                    <div className="absolute top-[-20%] left-[-20%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
                    <div className="absolute bottom-[-20%] right-[-20%] w-[300px] h-[300px] bg-[#5c9e45]/15 rounded-full blur-[80px] pointer-events-none" />
                    
                    <div className="grid md:grid-cols-12 gap-8 items-center relative z-10">
                        <div className="md:col-span-7 space-y-6">
                            <span className="bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-black rounded-full px-4 py-1.5 inline-block">
                                حلول الشركات ومكاتب الاستقدام
                            </span>
                            <h2 className="text-2xl md:text-3xl font-black leading-tight text-white">
                                {getB2BPlanCard(category).name}
                            </h2>
                            <p className="text-slate-300 text-sm leading-relaxed font-semibold">
                                {getB2BPlanCard(category).desc}
                            </p>
                            
                            <ul className="grid sm:grid-cols-2 gap-4">
                                {getB2BPlanCard(category).features.map((feature: string) => (
                                    <li key={feature} className="flex items-start gap-2.5 text-xs font-semibold leading-relaxed text-slate-200">
                                        <span className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                                            <Check size={11} strokeWidth={3} />
                                        </span>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        <div className="md:col-span-5 bg-white/5 border border-white/10 p-6 md:p-8 rounded-[2rem] text-center space-y-6 backdrop-blur-md">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mx-auto border border-blue-500/20">
                                <Building className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 font-bold block">اتفاقيات وعقود فوترة مرنة</span>
                                <span className="text-xl font-black text-white">خصومات تصل إلى 30% للمجموعات</span>
                            </div>
                            
                            <a 
                                href={`https://wa.me/${SITE_CONFIG.supportWhatsapp}?text=مرحباً، أود الاستفسار عن خدمات قطاع الأعمال والشركات لباقة: ${categories.find(c => c.id === category)?.title}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-4 h-13 rounded-2xl text-xs font-black flex items-center justify-center gap-2 bg-[#25D366] hover:bg-green-600 text-white shadow-lg shadow-green-900/20 transition-all duration-350 active:scale-98"
                            >
                                <span>طلب تسعير ومناقشة الخصومات</span>
                                <MessageCircle size={16} />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Redesigned Premium Glass FAQ Accordion with Glowing Borders */}
            <div className="max-w-4xl mx-auto px-6 mb-20 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-black text-slate-900 mb-4">الأسئلة الشائعة حول الاشتراكات</h2>
                    <p className="text-slate-500 text-sm font-bold">كل التفاصيل والإجابات المعتمدة عن حجز الخدمات والاعتماد</p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, idx) => {
                        const isActive = activeFaq === idx;
                        return (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: idx * 0.08 }}
                                className={`rounded-[2rem] transition-all duration-300 relative overflow-hidden ${
                                    isActive 
                                        ? "bg-white border-2 border-[#16539a]/60 shadow-[0_15px_30px_rgba(22,83,154,0.08)]" 
                                        : "bg-white/80 border border-slate-200/80 shadow-sm hover:border-[#16539a]/30 hover:bg-white"
                                }`}
                            >
                                {/* Outer Glowing Border Accent */}
                                {isActive && (
                                    <div className="absolute inset-0 -z-10 p-[1px] bg-gradient-to-br from-[#16539a] to-[#5c9e45] rounded-[2rem] opacity-30" />
                                )}

                                <button
                                    onClick={() => setActiveFaq(isActive ? null : idx)}
                                    className="w-full flex items-center justify-between p-6 text-right focus:outline-none"
                                >
                                    <span className={`font-black text-base md:text-lg transition-colors ${
                                        isActive ? "text-[#16539a]" : "text-slate-800"
                                    }`}>
                                        {faq.q}
                                    </span>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                        isActive ? "bg-[#16539a] text-white rotate-180" : "bg-slate-100 text-slate-400"
                                    }`}>
                                        <ChevronDown size={18} />
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {isActive && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                        >
                                            <div className="px-6 pb-6 text-sm text-slate-600 leading-relaxed font-medium border-t border-slate-50 pt-4">
                                                {faq.a}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Global Footer */}
            <Footer />
        </main>
    );
}
