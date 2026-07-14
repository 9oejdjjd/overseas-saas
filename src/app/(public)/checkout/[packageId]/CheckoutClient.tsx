"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ArrowRight, CheckCircle2, User, Phone, Briefcase, Sparkles, ShieldCheck, 
    HelpCircle, Loader2, Copy, Check, Upload, Image, MessageSquare, AlertCircle, 
    RefreshCw, Send, CheckCircle, Clock, ChevronDown, FileText, Mail, Lock, 
    Building2, MapPin, Camera, Search, FileDown
} from "lucide-react";
import Link from "next/link";
import { SITE_CONFIG } from "@/config/site";
import { Footer } from "@/components/mock/LandingComponents";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface SerializedPackage {
    id: string;
    name: string;
    nameEn: string;
    description: string;
    price: number;
    priceSAR: number;
    examCredits: number;
    validityDays: number | null;
    features: string[];
    includesRegistration?: boolean;
    includesTransport?: boolean;
    examPrice?: number;
    registrationDiscount?: number;
    transportDiscount?: number;
    transportType?: string | null;
    actualCost?: number;
}

interface Profession {
    id: string;
    name: string;
    slug: string;
}

interface WalletAccount {
    id: string;
    name: string;
    nameEn: string | null;
    accountNumber: string | null;
    accountName: string | null;
    isActive: boolean;
    icon: string | null;
    instructions: string | null;
    accounts?: any;
}

interface PurchaseData {
    purchaseId: string;
    amount: number;
    currency: string;
    buyerName: string;
    phone: string;
    packageName: string;
    packageNameEn: string | null;
    totalCredits: number;
    transactionRef: string;
}

export default function CheckoutClient({ package: pkg }: { package: SerializedPackage }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const originQueryId = searchParams?.get("originId") || "";
    const destinationQueryId = searchParams?.get("destinationId") || "";

    const getParsedAccounts = (wallet: any) => {
        if (!wallet || !wallet.accounts) return [];
        try {
            const parsed = typeof wallet.accounts === "string" ? JSON.parse(wallet.accounts) : wallet.accounts;
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    };

    const renderWalletLogo = (wallet: any) => {
        if (!wallet) return null;
        if (wallet.icon && (wallet.icon.startsWith("http") || wallet.icon.startsWith("/"))) {
            return <img src={wallet.icon} alt={wallet.name} className="w-8 h-8 object-contain rounded-xl shrink-0" />;
        }
        return (
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${getWalletIconColor(wallet.icon)}`}>
                {wallet.name.charAt(0)}
            </div>
        );
    };
    
    // Dynamic Step Management
    // step === 1: Basic Info
    // step === 2: Registration requirements & inputs (if pkg.includesRegistration === true)
    // step === 3: Payment & Verification
    const [step, setStep] = useState(1);
    
    // Data list states
    const [professions, setProfessions] = useState<Profession[]>([]);
    const [loadingProfessions, setLoadingProfessions] = useState(true);
    const [wallets, setWallets] = useState<WalletAccount[]>([]);
    const [loadingWallets, setLoadingWallets] = useState(false);

    // Dynamic pricing data states
    const [locations, setLocations] = useState<any[]>([]);
    const [serviceConfig, setServiceConfig] = useState<any>(null);
    const [routes, setRoutes] = useState<any[]>([]);
    const [currencies, setCurrencies] = useState<any[]>([]);

    // Form inputs (Step 1)
    const [buyerName, setBuyerName] = useState("");
    const [phone, setPhone] = useState("");
    const [selectedProfession, setSelectedProfession] = useState("");
    const [professionSearch, setProfessionSearch] = useState("");
    const [isProfessionOpen, setIsProfessionOpen] = useState(false);
    const professionRef = useRef<HTMLDivElement>(null);
    
    // Form inputs (Step 2 - Registration details)
    const [regQuadrupleName, setRegQuadrupleName] = useState("");
    const [selectedOriginId, setSelectedOriginId] = useState<string>(originQueryId);
    const [selectedDestinationId, setSelectedDestinationId] = useState<string>(destinationQueryId);
    const [regWhatsapp, setRegWhatsapp] = useState("");
    const [regEmail, setRegEmail] = useState("");
    const [regPassword, setRegPassword] = useState("");
    
    // Documents mock upload states (Step 2)
    const [passportFile, setPassportFile] = useState<File | null>(null);
    const [passportProgress, setPassportProgress] = useState(0);
    const [passportState, setPassportState] = useState<"idle" | "uploading" | "success">("idle");
    
    const [personalFile, setPersonalFile] = useState<File | null>(null);
    const [personalProgress, setPersonalProgress] = useState(0);
    const [personalState, setPersonalState] = useState<"idle" | "uploading" | "success">("idle");
    
    const [idCardFile, setIdCardFile] = useState<File | null>(null);
    const [idCardProgress, setIdCardProgress] = useState(0);
    const [idCardState, setIdCardState] = useState<"idle" | "uploading" | "success">("idle");

    // Form inputs (Step 3 - Automated Payment)
    const [transactionRef, setTransactionRef] = useState("");
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [uploadingFile, setUploadingFile] = useState(false);

    // Wallet selection states
    const [selectedWallet, setSelectedWallet] = useState<WalletAccount | null>(null);
    const [selectedCurrencyAccount, setSelectedCurrencyAccount] = useState<any>(null);
    const [copySuccess, setCopySuccess] = useState(false);

    // Form processing states
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    
    // Saved purchase response data
    const [purchaseData, setPurchaseData] = useState<PurchaseData | null>(null);

    // Verification countdown and polling states (Step 3)
    // status options: "none", "submitting", "waiting_sms", "under_review", "matched", "timeout"
    const [verificationStatus, setVerificationStatus] = useState<"none" | "submitting" | "waiting_sms" | "under_review" | "matched" | "timeout">("none");
    const [timeLeft, setTimeLeft] = useState(60); // 1 minute in seconds
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const getCalculatedPrices = () => {
        const sarCurrency = currencies.find(c => c.code === "SAR") || { buyRate: 530.00, sellRate: 533.00 };
        const sarBuyRate = Number(sarCurrency.buyRate) || 530.00;
        const sarSellRate = Number(sarCurrency.sellRate) || 533.00;

        const isDynamic = pkg.includesRegistration || pkg.includesTransport;

        if (isDynamic) {
            // 1. Base Mock Exam Price in SAR
            const examPriceSAR = pkg.priceSAR > 0 ? Number(pkg.priceSAR) : (Number(pkg.examPrice || 0) / sarBuyRate);

            // 2. Registration Price in SAR
            const regPriceYER = Number(serviceConfig?.registrationPrice || 16000);
            const registrationCostYER = pkg.includesRegistration 
                ? Math.max(0, regPriceYER - Number(pkg.registrationDiscount || 0)) 
                : 0;
            const registrationCostSAR = registrationCostYER / sarBuyRate;

            // 3. Transport Price in SAR
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
                    } else {
                        transportPriceSAR = baseRoutePrice / sarBuyRate;
                    }
                }
            }

            const transportDiscountSAR = Number(pkg.transportDiscount || 0) / sarBuyRate;
            const transportCostSAR = pkg.includesTransport 
                ? Math.max(0, transportPriceSAR - transportDiscountSAR) 
                : 0;

            // 4. Combined
            const priceSAR = Math.round(examPriceSAR + registrationCostSAR + transportCostSAR);
            const priceYER = Math.round(priceSAR * sarSellRate);

            return { priceYER, priceSAR };
        } else {
            // Exams only packages
            const examPriceSAR = pkg.priceSAR > 0 ? Number(pkg.priceSAR) : (Number(pkg.price || pkg.examPrice || 0) / sarBuyRate);
            const priceSAR = examPriceSAR;
            const priceYER = Math.round(priceSAR * sarSellRate);

            return { priceYER, priceSAR };
        }
    };

    const { priceYER: calculatedPriceYER, priceSAR: calculatedPriceSAR } = getCalculatedPrices();

    const getCalculatedBreakdown = (targetCurrency = purchaseData?.currency || "YER") => {
        const sarCurrency = currencies.find(c => c.code === "SAR") || { buyRate: 530.00, sellRate: 533.00 };
        const sarBuyRate = Number(sarCurrency.buyRate) || 530.00;
        const sarSellRate = Number(sarCurrency.sellRate) || 533.00;

        // Base package + registration fee
        const examPriceSAR = pkg.priceSAR > 0 ? Number(pkg.priceSAR) : (Number(pkg.examPrice || 0) / sarBuyRate);
        const examPriceYER = (pkg.examPrice && pkg.examPrice > 0) ? Number(pkg.examPrice) : (examPriceSAR * sarSellRate);

        const regPriceYER = Number(serviceConfig?.registrationPrice || 16000);
        const registrationCostYER = pkg.includesRegistration 
            ? Math.max(0, regPriceYER - Number(pkg.registrationDiscount || 0)) 
            : 0;

        // Transport Price
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

        const registrationCostSAR = registrationCostYER / sarBuyRate;

        if (targetCurrency === "SAR") {
            const baseAndRegSAR = Math.round(examPriceSAR + registrationCostSAR);
            const transportCostSARFinal = Math.round(transportCostSAR);
            return {
                baseAndReg: baseAndRegSAR,
                transportCost: transportCostSARFinal,
                total: Math.round(baseAndRegSAR + transportCostSARFinal),
                currencyText: "ر.س"
            };
        } else {
            const baseAndRegYER = Math.round(examPriceYER + registrationCostYER);
            const transportCostYERFinal = Math.round(transportCostYER);
            return {
                baseAndReg: baseAndRegYER,
                transportCost: transportCostYERFinal,
                total: Math.round(baseAndRegYER + transportCostYERFinal),
                currencyText: "ر.ي"
            };
        }
    };

    // Close profession list on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (professionRef.current && !professionRef.current.contains(event.target as Node)) {
                setIsProfessionOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch active available professions
    useEffect(() => {
        const fetchProfessions = async () => {
            try {
                const res = await fetch("/api/mock/public/professions");
                if (res.ok) {
                    const data = await res.json();
                    setProfessions(data);
                }
            } catch (err) {
                console.error("Error fetching professions:", err);
            } finally {
                setLoadingProfessions(false);
            }
        };
        fetchProfessions();
    }, []);

    // Fetch dynamic locations, routes, and configs
    useEffect(() => {
        const fetchPricingData = async () => {
            try {
                const [locRes, configRes, routesRes, currenciesRes] = await Promise.all([
                    fetch("/api/locations"),
                    fetch("/api/pricing/config"),
                    fetch("/api/pricing/routes"),
                    fetch("/api/pricing/currencies")
                ]);
                if (locRes.ok) setLocations(await locRes.json());
                if (configRes.ok) setServiceConfig(await configRes.json());
                if (routesRes.ok) setRoutes(await routesRes.json());
                if (currenciesRes.ok) setCurrencies(await currenciesRes.json());
            } catch (err) {
                console.error("Error fetching pricing and route data:", err);
            }
        };
        fetchPricingData();
    }, []);

    // Fetch wallets when moving to payment step
    useEffect(() => {
        if (step === 3) {
            const fetchWallets = async () => {
                setLoadingWallets(true);
                try {
                    const res = await fetch("/api/payments/wallets");
                    if (res.ok) {
                        const data = await res.json();
                        setWallets(data);
                        if (data.length > 0) {
                            setSelectedWallet(data[0]); // Select first wallet by default
                        }
                    }
                } catch (err) {
                    console.error("Error fetching wallets:", err);
                } finally {
                    setLoadingWallets(false);
                }
            };
            fetchWallets();
        }
    }, [step]);

    useEffect(() => {
        if (selectedWallet) {
            let initialAccount = null;
            if (selectedWallet.accounts) {
                let parsedAccounts = [];
                try {
                    parsedAccounts = typeof selectedWallet.accounts === "string" 
                        ? JSON.parse(selectedWallet.accounts) 
                        : selectedWallet.accounts;
                } catch(e) {
                    parsedAccounts = selectedWallet.accounts;
                }
                
                if (Array.isArray(parsedAccounts) && parsedAccounts.length > 0) {
                    // Try to match the currency of the purchase (e.g. YER or SAR)
                    const match = parsedAccounts.find((acc: any) => acc.currency === purchaseData?.currency);
                    initialAccount = match || parsedAccounts[0];
                }
            }
            setSelectedCurrencyAccount(initialAccount);
        } else {
            setSelectedCurrencyAccount(null);
        }
    }, [selectedWallet, purchaseData]);

    // Clean up polling interval on unmount
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        };
    }, []);

    // Formatting seconds into MM:SS
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    // Simulated file upload for Step 2 documents (adds incredibly professional look and feel)
    const handleDocumentUpload = (
        file: File, 
        setProgress: (p: number) => void, 
        setState: (s: "idle" | "uploading" | "success") => void,
        setFileState: (f: File | null) => void
    ) => {
        setFileState(file);
        setState("uploading");
        setProgress(0);
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            setProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                setState("success");
            }
        }, 120);
    };

    // Step 1: Submit Basic Info
    const handleStep1Submit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!buyerName || !phone || !selectedProfession) {
            setError("يرجى ملء كافة البيانات المطلوبة");
            return;
        }

        const cleanPhone = phone.trim();
        if (cleanPhone.length < 9) {
            setError("يرجى إدخال رقم هاتف واتساب صحيح ومكتمل");
            return;
        }

        // If package includes registration, go to Step 2 (Registration Details)
        if (pkg.includesRegistration) {
            setStep(2);
        } else {
            // Exams only: Create order directly and go to Step 3 (Payment)
            handleCreateOrder();
        }
    };

    // Step 2: Submit Registration Info & Create Order
    const handleStep2Submit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const originLoc = locations.find(l => l.id === selectedOriginId);
        const destLoc = locations.find(l => l.id === selectedDestinationId);

        if (!regQuadrupleName || !destLoc || (pkg.includesTransport && !originLoc) || !regWhatsapp || !regEmail || !regPassword) {
            setError("يرجى تعبئة كافة الحقول المطلوبة لملف التسجيل واختيار مدينة الإقامة ومركز الاختبار");
            return;
        }

        // Compile registration details into paymentNote
        const regNote = JSON.stringify({
            quadrupleName: regQuadrupleName,
            currentCity: originLoc ? originLoc.name : "",
            examCity: destLoc ? destLoc.name : "",
            whatsapp: regWhatsapp,
            email: regEmail,
            password: regPassword,
            documentsInstruction: "سوف تطلب خدمة العملاء صور جواز السفر، الصورة الشخصية، وصورة الهوية لاحقاً عبر الواتساب لتنشيط الملف.",
            registrationTimestamp: new Date().toISOString()
        });

        // Call the database API to create order
        handleCreateOrder(regNote);
    };

    // Update purchase currency and amount in the database securely
    const handleUpdateCurrency = async (newCurrency: "YER" | "SAR") => {
        if (!purchaseData || purchaseData.currency === newCurrency) return;

        setSubmitting(true);
        setError("");
        try {
            const res = await fetch("/api/payments/update-currency", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    purchaseId: purchaseData.purchaseId,
                    currency: newCurrency
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setPurchaseData(prev => prev ? {
                    ...prev,
                    amount: data.amount,
                    currency: data.currency
                } : null);
            } else {
                setError(data.error || "فشل تحديث عملة التحويل");
            }
        } catch (err) {
            console.error("Error updating currency:", err);
            setError("فشل الاتصال بالخادم لتحديث العملة");
        } finally {
            setSubmitting(false);
        }
    };

    // Create purchase record in the database
    const handleCreateOrder = async (registrationNote?: string) => {
        setSubmitting(true);
        setError("");
        
        const cleanPhone = phone.trim();
        
        try {
            const res = await fetch("/api/payments/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    packageId: pkg.id,
                    buyerName: regQuadrupleName || buyerName,
                    phone: cleanPhone,
                    profession: selectedProfession,
                    paymentNote: registrationNote || null,
                    currentCityId: selectedOriginId || null,
                    examCityId: selectedDestinationId || null
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setPurchaseData(data);
                setStep(3); // Advance to Payment Step
                setVerificationStatus("waiting_sms");
                startPollingPurchaseStatus(data.purchaseId);
            } else {
                setError(data.error || "حدث خطأ أثناء إنشاء الطلب، يرجى المحاولة لاحقاً");
            }
        } catch (err) {
            console.error("Error creating order:", err);
            setError("فشل الاتصال بالخادم، يرجى التحقق من اتصالك بالإنترنت");
        } finally {
            setSubmitting(false);
        }
    };

    // Copy to clipboard helper
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    // Polling function with 5-minute countdown clock
    const startPollingPurchaseStatus = (purchaseId: string) => {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        
        let localTimeLeft = 60;
        setTimeLeft(60);

        pollingIntervalRef.current = setInterval(async () => {
            localTimeLeft -= 1;
            setTimeLeft(localTimeLeft);

            // Fetch state from database every 5 seconds
            if (localTimeLeft % 5 === 0) {
                try {
                    const res = await fetch(`/api/pricing/mock-packages/check-credits?phone=${phone}`);
                    if (res.ok) {
                        const data = await res.json();
                        
                        const currentPurchase = data.purchases?.find((p: any) => p.id === purchaseId);
                        if (currentPurchase && (currentPurchase.status === "PAID" || currentPurchase.remaining > 0)) {
                            setVerificationStatus("matched");
                            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
                            return;
                        }
                    }
                } catch (err) {
                    console.error("Polling error:", err);
                }
            }

            // Timeout after 5 minutes (300 seconds)
            if (localTimeLeft <= 0) {
                setVerificationStatus("timeout");
                if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            }
        }, 1000);
    };

    // Submit Reference Number for Automated Verification (Auto SMS)
    const handleVerifySms = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        
        if (!transactionRef.trim()) {
            setError("يرجى إدخال رقم العملية أولاً");
            return;
        }

        if (transactionRef.trim().length < 6) {
            setError("يرجى إدخال رقم عملية صحيح ومكتمل");
            return;
        }

        setSubmitting(true);
        setVerificationStatus("submitting");
        
        try {
            const res = await fetch("/api/payments/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    purchaseId: purchaseData?.purchaseId,
                    transactionRef: transactionRef.trim(),
                    paymentMethod: selectedWallet?.name || null
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                if (data.isMatched) {
                    setVerificationStatus("matched");
                } else {
                    setVerificationStatus("waiting_sms");
                    startPollingPurchaseStatus(purchaseData!.purchaseId);
                }
            } else {
                setError(data.error || "فشل تسجيل رقم العملية، يرجى المحاولة لاحقاً");
                setVerificationStatus("none");
            }
        } catch (err) {
            console.error("Error verifying SMS:", err);
            setError("فشل في الاتصال بالخادم، يرجى المحاولة مجدداً");
            setVerificationStatus("none");
        } finally {
            setSubmitting(false);
        }
    };

    // Submit Manual Proof Upload & WhatsApp Redirect (Fallback Step)
    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!proofFile) {
            setError("يرجى إرفاق صورة إشعار أو سند التحويل المالي");
            return;
        }

        setSubmitting(true);
        setUploadingFile(true);

        const formData = new FormData();
        formData.append("purchaseId", purchaseData!.purchaseId);
        formData.append("file", proofFile);
        formData.append("paymentMethod", selectedWallet?.name || "");

        try {
            const res = await fetch("/api/payments/upload-proof", {
                method: "POST",
                body: formData
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setVerificationStatus("under_review");
                // Open WhatsApp immediately with receipt link and transaction reference
                const orderShortId = purchaseData!.purchaseId.slice(0, 8).toUpperCase();
                const whatsappMessage = `مرحباً بوابة الاعتماد المهني، لقد قمت بطلب الاشتراك في باقة: (${purchaseData!.packageName}) بقيمة [${purchaseData!.amount} ريال يمني]. رقم الطلب: [ORDER-${orderShortId}]. رقم العملية المرجعي للمطابقة: [${purchaseData!.transactionRef}]. لقد قمت بتحويل الرسوم وهذا رابط إشعار التحويل المرفوع: ${data.url}`;
                window.open(`https://wa.me/${SITE_CONFIG.supportWhatsapp}?text=${encodeURIComponent(whatsappMessage)}`, "_blank");
            } else {
                setError(data.error || "فشل رفع السند، يرجى المحاولة مجدداً أو تواصل مع خدمة العملاء");
            }
        } catch (err) {
            console.error("Error uploading proof:", err);
            setError("فشل الاتصال بالخادم لرفع السند يدوياً");
        } finally {
            setSubmitting(false);
            setUploadingFile(false);
        }
    };

    const getWalletIconColor = (icon: string | null) => {
        switch (icon) {
            case "kuraimi": return "bg-amber-100 text-amber-700";
            case "onecash": return "bg-red-100 text-red-700";
            case "jawwalpay": return "bg-emerald-100 text-emerald-700";
            default: return "bg-slate-100 text-slate-700";
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100/50 to-slate-50 text-right" dir="rtl">
            {/* Header Navigation */}
            <div className="border-b border-slate-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-40 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-[#16539a]/5 flex items-center justify-center text-[#16539a] shadow-sm">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <span className="font-bold text-slate-800 text-sm block tracking-wide">تأكيد الاشتراك والدفع</span>
                            <span className="text-[9px] text-[#5c9e45] font-black block tracking-widest mt-0.5">الاعتماد المهني</span>
                        </div>
                    </div>
                    
                    <Link 
                        href="/pricing"
                        className="text-xs font-bold text-slate-550 hover:text-[#16539a] flex items-center gap-1 bg-slate-50 hover:bg-blue-50/40 px-3.5 py-1.5 rounded-full transition-all border border-slate-200/50"
                    >
                        <span>تراجع وإلغاء</span>
                        <ArrowRight size={13} />
                    </Link>
                </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="max-w-xl mx-auto px-4 mt-8">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
                    
                    {/* Step 1 indicator */}
                    <div className="relative z-10 flex flex-col items-center gap-1.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 shadow-sm border ${
                            step >= 1 
                                ? "bg-[#16539a] border-blue-600 text-white shadow-blue-500/20" 
                                : "bg-white border-slate-250 text-slate-400"
                        }`}>
                            1
                        </div>
                        <span className={`text-[9px] font-black transition-colors duration-300 ${step >= 1 ? "text-[#16539a]" : "text-slate-400"}`}>
                            البيانات الأساسية
                        </span>
                    </div>

                    {/* Step 2 indicator (Only highlights if registration is included) */}
                    {pkg.includesRegistration && (
                        <div className="relative z-10 flex flex-col items-center gap-1.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 shadow-sm border ${
                                step >= 2 
                                    ? "bg-[#16539a] border-blue-600 text-white shadow-blue-500/20" 
                                    : "bg-white border-slate-250 text-slate-400"
                            }`}>
                                2
                            </div>
                            <span className={`text-[9px] font-black transition-colors duration-300 ${step >= 2 ? "text-[#16539a]" : "text-slate-400"}`}>
                                متطلبات التسجيل
                            </span>
                        </div>
                    )}

                    {/* Step 3 indicator */}
                    <div className="relative z-10 flex flex-col items-center gap-1.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 shadow-sm border ${
                            step >= 3 
                                ? "bg-[#16539a] border-blue-600 text-white shadow-blue-500/20" 
                                : "bg-white border-slate-250 text-slate-400"
                        }`}>
                            {pkg.includesRegistration ? 3 : 2}
                        </div>
                        <span className={`text-[9px] font-black transition-colors duration-300 ${step >= 3 ? "text-[#16539a]" : "text-slate-400"}`}>
                            التفعيل التلقائي
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="max-w-7xl mx-auto px-4 mt-8 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* LEFT SIDE: Package Summary Card */}
                    <div className="lg:col-span-5 lg:sticky lg:top-20">
                        <Card className="border border-slate-200/80 rounded-3xl shadow-lg shadow-slate-100/50 bg-white overflow-hidden">
                            <div className="bg-gradient-to-br from-[#0c2340] to-slate-900 text-white p-6 relative overflow-hidden">
                                <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                                <div className="absolute left-0 bottom-0 w-32 h-32 bg-[#5c9e45]/10 rounded-full blur-3xl pointer-events-none" />
                                
                                <span className="text-[10px] font-black tracking-widest text-[#5c9e45] uppercase block mb-1">ملخص الاشتراك</span>
                                <h2 className="text-xl font-bold tracking-tight mb-2 text-white">{pkg.name}</h2>
                                <p className="text-xs text-slate-350 leading-relaxed font-semibold min-h-[32px]">{pkg.description}</p>
                            </div>
                            
                            <CardContent className="p-6 space-y-6">
                                {/* Pricing Details */}
                                <div className="bg-slate-50/50 border border-slate-100 p-4.5 rounded-2xl space-y-3">
                                    {calculatedPriceSAR > 0 && (
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-xs font-bold text-slate-450">الرسوم الأساسية بالريال السعودي:</span>
                                            <span className="text-lg font-black text-slate-800">{calculatedPriceSAR.toLocaleString()} ر.س</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-baseline pt-2 border-t border-slate-100">
                                        <span className="text-xs font-black text-[#16539a]">الإجمالي المستحق بالريال اليمني:</span>
                                        <span className="text-xl font-black text-[#16539a]">{calculatedPriceYER.toLocaleString()} ر.ي</span>
                                    </div>
                                </div>

                                {/* Validity Days */}
                                {pkg.validityDays && (
                                    <div className="flex justify-between items-baseline border-b border-slate-100 pb-4">
                                        <span className="text-xs font-bold text-slate-500">فترة صلاحية الباقة:</span>
                                        <span className="text-sm font-bold text-slate-700">{pkg.validityDays} يوماً من التفعيل</span>
                                    </div>
                                )}

                                {/* Features List */}
                                <div className="pt-2">
                                    <span className="text-[10px] font-black text-slate-400 block mb-3">ميزات الباقة:</span>
                                    <ul className="space-y-3">
                                        {[
                                            pkg.examCredits === -1 
                                                ? "محاولات اختبارات تجريبية غير محدودة محاكية للاعتماد المهني"
                                                : `${pkg.examCredits} اختبارات تجريبية محاكية للاعتماد المهني`,
                                            ...(pkg.features || [])
                                        ].map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-xs font-semibold text-slate-600 leading-relaxed">
                                                <CheckCircle2 size={14} className="text-[#5c9e45] mt-0.5 shrink-0" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT SIDE: Dynamic Steps Container */}
                    <div className="lg:col-span-7">
                        <AnimatePresence mode="wait">
                            
                            {/* STEP 1: Basic Info Form */}
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="bg-white border border-slate-200/80 p-8 rounded-3xl shadow-xl shadow-slate-100/50 space-y-6"
                                >
                                    <div className="border-b border-slate-100 pb-4">
                                        <h2 className="text-xl font-bold text-slate-900">الخطوة الأولى: المعلومات الأساسية</h2>
                                        <p className="text-xs text-slate-400 mt-1">يرجى كتابة اسمك ورقم هاتفك لربط وتفعيل باقة الاختبارات تلقائياً فور تأكيد الاشتراك.</p>
                                    </div>

                                    {error && (
                                        <div className="bg-red-50 border border-red-100/80 text-red-700 text-xs font-semibold p-4 rounded-2xl flex items-center gap-2">
                                            <AlertCircle size={15} className="shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <form onSubmit={handleStep1Submit} className="space-y-5">
                                        {/* Input Name */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                                <User size={14} className="text-slate-400" />
                                                <span>الاسم الكامل *</span>
                                            </label>
                                            <input 
                                                type="text"
                                                value={buyerName}
                                                onChange={e => setBuyerName(e.target.value)}
                                                placeholder="مثال: أحمد محمد علي"
                                                className="w-full rounded-xl border border-slate-200 bg-white px-4 h-11 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                                required
                                            />
                                        </div>

                                        {/* Input Phone */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                                <Phone size={14} className="text-slate-400" />
                                                <span>رقم الواتساب *</span>
                                            </label>
                                            <input 
                                                type="tel"
                                                value={phone}
                                                onChange={e => setPhone(e.target.value)}
                                                placeholder="مثال: 777263111"
                                                className="w-full rounded-xl border border-slate-200 bg-white px-4 h-11 text-xs text-left font-sans tracking-wide focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                                dir="ltr"
                                                required
                                            />
                                            <span className="text-[10px] text-slate-400 block mt-1">يرجى التأكد من كتابة الرقم بشكل صحيح لاستقبال تفاصيل التفعيل وتحديثات الخدمة.</span>
                                        </div>

                                        {/* Searchable Combobox for Profession Selection */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                                <Briefcase size={14} className="text-slate-400" />
                                                <span>التخصص الدراسي / المهنة *</span>
                                            </label>
                                            
                                            {loadingProfessions ? (
                                                <div className="flex items-center gap-2 h-11 px-4 border border-slate-200 rounded-xl bg-slate-50/50">
                                                    <Loader2 size={14} className="animate-spin text-blue-600" />
                                                    <span className="text-[10px] text-slate-400 font-bold">جاري تحميل المهن المتاحة...</span>
                                                </div>
                                            ) : (
                                                <div className="relative" ref={professionRef}>
                                                    <div className="relative">
                                                        <input 
                                                            type="text"
                                                            value={professionSearch}
                                                            onChange={(e) => {
                                                                setProfessionSearch(e.target.value);
                                                                setSelectedProfession("");
                                                                setIsProfessionOpen(true);
                                                            }}
                                                            onFocus={() => setIsProfessionOpen(true)}
                                                            placeholder="ابحث أو اختر تخصصك الدراسي..."
                                                            className="w-full rounded-xl border border-slate-200 bg-white pr-10 pl-4 h-11 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                                            required
                                                        />
                                                        <Search className="absolute right-3.5 top-3.5 text-slate-400 h-4 w-4 pointer-events-none" />
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsProfessionOpen(!isProfessionOpen)}
                                                            className="absolute left-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                                                        >
                                                            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isProfessionOpen ? "rotate-180" : ""}`} />
                                                        </button>
                                                    </div>
                                                    
                                                    {isProfessionOpen && (
                                                        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-250/60 rounded-2xl shadow-xl max-h-60 overflow-y-auto py-1.5 text-right scrollbar-thin">
                                                            {professions.filter(p => p.name.toLowerCase().includes(professionSearch.toLowerCase())).length === 0 ? (
                                                                <div className="px-4 py-3 text-xs text-slate-400 font-bold">عفواً، لا توجد مهن مطابقة لبحثك</div>
                                                            ) : (
                                                                professions
                                                                    .filter(p => p.name.toLowerCase().includes(professionSearch.toLowerCase()))
                                                                    .map(p => (
                                                                        <button
                                                                            key={p.id}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setSelectedProfession(p.name);
                                                                                setProfessionSearch(p.name);
                                                                                setIsProfessionOpen(false);
                                                                            }}
                                                                            className="w-full text-right px-4.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-blue-50/30 hover:text-[#16539a] transition-all flex items-center justify-between"
                                                                        >
                                                                            <span>{p.name}</span>
                                                                            {selectedProfession === p.name && (
                                                                                <Check className="text-blue-600 h-3.5 w-3.5 shrink-0" />
                                                                            )}
                                                                        </button>
                                                                    ))
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Security Details */}
                                        <div className="bg-slate-50/50 border border-slate-200/50 p-4 rounded-2xl flex gap-3 items-start mt-6">
                                            <ShieldCheck className="text-[#5c9e45] h-5 w-5 shrink-0 mt-0.5" />
                                            <div>
                                                <span className="text-[10px] font-black text-slate-800 block">أمان وسرية البيانات</span>
                                                <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">نحن نحافظ على سرية بياناتك بالكامل. بمجرد التحقق من الحوالة، ستقوم المنصة بتنشيط رصيد حسابك تلقائياً.</p>
                                            </div>
                                        </div>

                                        <Button 
                                            type="submit"
                                            className="w-full rounded-2xl h-13 text-sm font-black text-white bg-gradient-to-r from-[#16539a] to-[#5c9e45] shadow-lg shadow-blue-100 hover:shadow-xl transition-all duration-350 flex items-center justify-center gap-2 mt-8 active:scale-98"
                                            disabled={submitting}
                                        >
                                            {submitting ? (
                                                <>
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                    <span>جاري إنشاء طلبك...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>{pkg.includesRegistration ? "الاستمرار لخطوة متطلبات التسجيل" : "تأكيد الطلب والاستمرار للدفع"}</span>
                                                    <ArrowRight size={18} className="rotate-180" />
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </motion.div>
                            )}

                            {/* STEP 2: Registration requirements & Details Form */}
                            {step === 2 && pkg.includesRegistration && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="bg-white border border-slate-200/80 p-8 rounded-3xl shadow-xl shadow-slate-100/50 space-y-6"
                                >
                                    <div className="border-b border-slate-100 pb-4">
                                        <h2 className="text-xl font-bold text-[#16539a]">الخطوة الثانية: تفاصيل التسجيل الرسمي</h2>
                                        <p className="text-xs text-slate-450 mt-1">يرجى تعبئة الحقول المطلوبة لملف التسجيل في برنامج الاعتماد المهني.</p>
                                    </div>

                                    {error && (
                                        <div className="bg-red-50 border border-red-100/80 text-red-700 text-xs font-semibold p-4 rounded-2xl flex items-center gap-2">
                                            <AlertCircle size={15} className="shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    {/* Illustrative Requirements Cards */}
                                    <div className="space-y-3 bg-slate-50/50 border border-slate-100 p-4.5 rounded-2xl">
                                        <span className="text-[10px] font-black text-slate-500 block mb-2">المستندات المطلوبة للتسجيل (يرجى إرفاقها أدناه):</span>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div className="bg-white border border-slate-200/60 p-3 rounded-xl flex items-center gap-2 shadow-sm">
                                                <FileText className="text-blue-500 h-5 w-5 shrink-0" />
                                                <span className="text-[10px] font-bold text-slate-700">صورة واضحة من جواز السفر</span>
                                            </div>
                                            <div className="bg-white border border-slate-200/60 p-3 rounded-xl flex items-center gap-2 shadow-sm">
                                                <Camera className="text-emerald-500 h-5 w-5 shrink-0" />
                                                <span className="text-[10px] font-bold text-slate-700">صورة شخصية حديثة بخلفية بيضاء</span>
                                            </div>
                                            <div className="bg-white border border-slate-200/60 p-3 rounded-xl flex items-center gap-2 shadow-sm">
                                                <ShieldCheck className="text-amber-500 h-5 w-5 shrink-0" />
                                                <span className="text-[10px] font-bold text-slate-700">صورة الهوية الوطنية أو البطاقة</span>
                                            </div>
                                        </div>
                                    </div>

                                    <form onSubmit={handleStep2Submit} className="space-y-6">
                                        
                                        {/* Row 1: Full Quadruple Name & Whatsapp */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-655 flex items-center gap-1.5">
                                                    <User size={13} className="text-slate-400" />
                                                    <span>الاسم الرباعي الكامل (المطابق لجواز السفر) *</span>
                                                </label>
                                                <Input 
                                                    type="text"
                                                    value={regQuadrupleName}
                                                    onChange={e => setRegQuadrupleName(e.target.value)}
                                                    placeholder="مثال: أحمد محمد علي صالح"
                                                    className="rounded-xl border-slate-200 h-11 text-xs"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-655 flex items-center gap-1.5">
                                                    <MessageSquare size={13} className="text-slate-400" />
                                                    <span>رقم الواتساب للتواصل ومتابعة الملف *</span>
                                                </label>
                                                <Input 
                                                    type="tel"
                                                    value={regWhatsapp}
                                                    onChange={e => setRegWhatsapp(e.target.value)}
                                                    placeholder="مثال: 777263111"
                                                    className="rounded-xl border-slate-200 h-11 text-left text-xs font-sans"
                                                    dir="ltr"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Row 2: Cities */}
                                        <div className={`grid grid-cols-1 ${pkg.includesTransport ? "sm:grid-cols-2" : ""} gap-4`}>
                                            {/* Residence City */}
                                            {pkg.includesTransport && (
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-655 flex items-center gap-1.5">
                                                        <MapPin size={13} className="text-slate-400" />
                                                        <span>مدينة الإقامة الحالية (الانطلاق) *</span>
                                                    </label>
                                                    <select
                                                        value={selectedOriginId}
                                                        onChange={(e) => {
                                                            setSelectedOriginId(e.target.value);
                                                            setSelectedDestinationId("");
                                                        }}
                                                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 h-11 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                                        required
                                                    >
                                                        <option value="">اختر مدينة الإقامة الحالية...</option>
                                                        {locations.map((loc) => (
                                                            <option key={loc.id} value={loc.id}>
                                                                {loc.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {/* Exam City */}
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-655 flex items-center gap-1.5">
                                                    <Building2 size={13} className="text-slate-400" />
                                                    <span>مركز تقديم الاختبار المطلوب (الوجهة) *</span>
                                                </label>
                                                <select
                                                    value={selectedDestinationId}
                                                    onChange={(e) => setSelectedDestinationId(e.target.value)}
                                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 h-11 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                                    disabled={pkg.includesTransport && !selectedOriginId}
                                                    required
                                                >
                                                    <option value="">اختر مركز تقديم الاختبار...</option>
                                                    {locations
                                                        .filter(loc => {
                                                            if (!pkg.includesTransport) return true;
                                                            const originLoc = locations.find(l => l.id === selectedOriginId);
                                                            if (!originLoc) return false;
                                                            return routes.some(r => r.fromDestination?.name === originLoc.name && r.toDestination?.name === loc.name);
                                                        })
                                                        .map((loc) => (
                                                            <option key={loc.id} value={loc.id}>
                                                                {loc.name}
                                                            </option>
                                                        ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Row 3: New Email & Password for registration */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-655 flex items-center gap-1.5">
                                                    <Mail size={13} className="text-slate-400" />
                                                    <span>البريد الإلكتروني الجديد المخصص للتسجيل *</span>
                                                </label>
                                                <Input 
                                                    type="email"
                                                    value={regEmail}
                                                    onChange={e => setRegEmail(e.target.value)}
                                                    placeholder="مثال: test@accreditation.com"
                                                    className="rounded-xl border-slate-200 h-11 text-left text-xs font-sans"
                                                    dir="ltr"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-655 flex items-center gap-1.5">
                                                    <Lock size={13} className="text-slate-400" />
                                                    <span>كلمة مرور البريد المذكور *</span>
                                                </label>
                                                <Input 
                                                    type="password"
                                                    value={regPassword}
                                                    onChange={e => setRegPassword(e.target.value)}
                                                    placeholder="أدخل كلمة مرور قوية"
                                                    className="rounded-xl border-slate-200 h-11 text-left text-xs font-sans"
                                                    dir="ltr"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Documents Requirements - Informational Only */}
                                        <div className="space-y-4 pt-4 border-t border-slate-100 text-right">
                                            <span className="text-[10px] font-black text-slate-500 block">المستندات الرسمية المطلوبة لإكمال ملفك (سيطلبها موظف خدمة العملاء لاحقاً):</span>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div className="bg-slate-50 border border-slate-200/60 p-4.5 rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
                                                    <FileText className="h-6 w-6 text-blue-500" />
                                                    <span className="text-xs font-bold text-slate-700">جواز السفر</span>
                                                    <span className="text-[9px] text-slate-400">صورة واضحة لصفحة البيانات</span>
                                                </div>
                                                <div className="bg-slate-50 border border-slate-200/60 p-4.5 rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
                                                    <Camera className="h-6 w-6 text-emerald-500" />
                                                    <span className="text-xs font-bold text-slate-700">الصورة الشخصية</span>
                                                    <span className="text-[9px] text-slate-400">حديثة بخلفية بيضاء</span>
                                                </div>
                                                <div className="bg-slate-50 border border-slate-200/60 p-4.5 rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
                                                    <ShieldCheck className="h-6 w-6 text-amber-500" />
                                                    <span className="text-xs font-bold text-slate-700">الهوية الوطنية</span>
                                                    <span className="text-[9px] text-slate-400">أو الإقامة وبطاقة العمل</span>
                                                </div>
                                            </div>

                                            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 items-start mt-4">
                                                <AlertCircle className="text-amber-600 h-5 w-5 shrink-0 mt-0.5" />
                                                <div>
                                                    <span className="text-xs font-bold text-amber-800 block">توجيهات هامة بخصوص المستندات:</span>
                                                    <p className="text-[10px] text-amber-700 leading-relaxed mt-1">
                                                        لا تحتاج لرفع أي ملفات أو وثائق في هذا النموذج حالياً. يرجى المتابعة لإتمام اختيار وسيلة الدفع وتأكيد الحوالة. بمجرد التفعيل، سيقوم موظفو الدعم الفني وخدمة العملاء بالتواصل معك مباشرة عبر الواتساب لاستلام وثائقك الرسمية المذكورة أعلاه وتدقيقها لإكمال إجراءات تسجيلك بالاعتماد المهني.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-4 border-t border-slate-100">
                                            <Button 
                                                type="button" 
                                                variant="outline"
                                                onClick={() => setStep(1)}
                                                className="rounded-2xl h-12 text-xs font-bold border-slate-200 text-slate-500 flex items-center justify-center gap-1 active:scale-98 transition-all"
                                                disabled={submitting}
                                            >
                                                <ArrowRight size={15} />
                                                <span>السابق</span>
                                            </Button>
                                            
                                            <Button 
                                                type="submit" 
                                                className="flex-1 rounded-2xl h-12 text-xs font-black text-white bg-gradient-to-r from-[#16539a] to-[#5c9e45] shadow-lg shadow-blue-100 flex items-center justify-center gap-2 active:scale-98"
                                                disabled={submitting}
                                            >
                                                {submitting ? (
                                                    <>
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                        <span>جاري تسجيل البيانات...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>تأكيد المستندات والاستمرار لاختيار السداد</span>
                                                        <ArrowRight size={15} className="rotate-180" />
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}

                            {/* STEP 3: Payment & Verification Screen */}
                            {step === 3 && purchaseData && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="bg-white border border-slate-200/80 p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-100/50 space-y-6"
                                >
                                    
                                    {/* ── SUB-STATE: SUCCESS MATCHED ── */}
                                    {verificationStatus === "matched" && (
                                        <div className="flex flex-col items-center justify-center py-10 text-center space-y-6 animate-in zoom-in-95 duration-350">
                                            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-100 shadow-lg shadow-emerald-50 animate-bounce">
                                                <CheckCircle className="h-12 w-12" />
                                            </div>
                                            
                                            <div className="space-y-2 max-w-sm">
                                                <h3 className="font-black text-[#5c9e45] text-lg">تم تفعيل باقة الاختبارات بنجاح</h3>
                                                <p className="text-xs text-slate-550 leading-relaxed font-bold">
                                                    مرحباً {buyerName || purchaseData.buyerName}، تم التحقق من عملية الدفع وتفعيل الرصيد في حسابك بنجاح. يمكنك الآن البدء بالاختبارات التجريبية.
                                                </p>
                                            </div>

                                            <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-2xl w-full max-w-sm space-y-2.5 text-xs text-right">
                                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                                    <span className="text-slate-400 font-bold">الباقة المشتراة:</span>
                                                    <span className="font-bold text-slate-800">{purchaseData.packageName}</span>
                                                </div>
                                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                                    <span className="text-slate-400 font-bold">عدد المحاولات:</span>
                                                    <span className="font-black text-slate-800">{purchaseData.totalCredits === -1 ? "محاولات مفتوحة" : `${purchaseData.totalCredits} اختبارات`}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-slate-400 font-bold">رقم هاتفك المعتمد:</span>
                                                    <span className="font-bold text-slate-800 font-sans">{purchaseData.phone}</span>
                                                </div>
                                            </div>

                                            <Button
                                                onClick={() => router.push(`/session?phone=${encodeURIComponent(purchaseData.phone)}`)}
                                                className="w-full max-w-sm rounded-2xl h-13 text-sm font-black text-white bg-gradient-to-r from-[#16539a] to-[#5c9e45] shadow-lg shadow-blue-100 flex items-center justify-center gap-2 active:scale-98 transition-all"
                                            >
                                                <span>ابدأ اختبارك التجريبي الأول الآن</span>
                                                <ArrowRight size={18} className="rotate-180" />
                                            </Button>
                                        </div>
                                    )}

                                    {/* ── SUB-STATE: UNDER MANUAL REVIEW ── */}
                                    {verificationStatus === "under_review" && (
                                        <div className="flex flex-col items-center justify-center py-10 text-center space-y-6 animate-in zoom-in-95 duration-350">
                                            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center border border-blue-100 shadow-lg shadow-blue-50">
                                                <Clock className="h-12 w-12 animate-pulse" />
                                            </div>
                                            
                                            <div className="space-y-2 max-w-sm">
                                                <h3 className="font-black text-[#16539a] text-lg">الطلب قيد المراجعة والتحقق</h3>
                                                <p className="text-xs text-slate-550 leading-relaxed font-bold">
                                                    مرحباً {buyerName || purchaseData.buyerName}، تم استلام السند بنجاح. سنقوم بمراجعة الطلب والمطابقة وتفعيل حسابك في أقرب وقت ممكن.
                                                </p>
                                            </div>

                                            <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-2xl w-full max-w-sm space-y-2.5 text-xs text-right">
                                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                                    <span className="text-slate-400 font-bold">رقم الطلب الخاص بك:</span>
                                                    <span className="font-mono font-black text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200/50">ORDER-{purchaseData.purchaseId.slice(0, 8).toUpperCase()}</span>
                                                </div>
                                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                                    <span className="text-slate-400 font-bold">الباقة المطلوبة:</span>
                                                    <span className="font-bold text-slate-800">{purchaseData.packageName}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-slate-400 font-bold">حالة المراجعة:</span>
                                                    <span className="font-black text-blue-600 flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping" />
                                                        <span>قيد التحقق يدوياً</span>
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="w-full max-w-sm space-y-3">
                                                <Button
                                                    onClick={() => {
                                                        const orderShortId = purchaseData.purchaseId.slice(0, 8).toUpperCase();
                                                        const whatsappMessage = `مرحباً بوابة الاعتماد المهني، لقد قمت بطلب الاشتراك في باقة: (${purchaseData.packageName}) يدوياً برقم طلب: [ORDER-${orderShortId}]. واسمي: ${buyerName || purchaseData.buyerName} ورقمي: ${purchaseData.phone}. قمت بتحويل الرسوم ورفع صورة السند في الموقع، يرجى تفعيل حسابي وسرعة المراجعة.`;
                                                        window.open(`https://wa.me/${SITE_CONFIG.supportWhatsapp}?text=${encodeURIComponent(whatsappMessage)}`, "_blank");
                                                    }}
                                                    className="w-full rounded-2xl h-13 text-sm font-black text-white bg-[#25D366] hover:bg-green-600 shadow-lg shadow-green-100 flex items-center justify-center gap-2 active:scale-98 transition-all"
                                                >
                                                    <MessageSquare size={18} />
                                                    <span>تواصل مع الدعم عبر الواتساب لتسريع التفعيل</span>
                                                </Button>
                                                
                                                <Button
                                                    onClick={() => router.push("/")}
                                                    variant="outline"
                                                    className="w-full rounded-xl h-11 text-xs font-bold border-slate-200 text-slate-500 active:scale-98"
                                                >
                                                    العودة للرئيسية ومتابعة التفعيل لاحقاً
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── UNIFIED FLOW (NONE, WAITING_SMS, TIMEOUT, SUBMITTING) ── */}
                                    {["none", "waiting_sms", "timeout", "submitting"].includes(verificationStatus) && (
                                        <div className="space-y-6 text-right">
                                            <div className="border-b border-slate-100 pb-4">
                                                <h2 className="text-xl font-bold text-slate-900">تأكيد التحويل والدفع</h2>
                                                <p className="text-xs text-slate-400 mt-1">يرجى تحويل رسوم الباقة الموضحة أدناه إلى الحساب المختار، ثم إدخال رقم العملية المرجعي للمطابقة والتفعيل الفوري.</p>
                                            </div>

                                            {error && (
                                                <div className="bg-red-50 border border-red-100/80 text-red-700 text-xs font-semibold p-4 rounded-2xl flex items-center gap-2">
                                                    <AlertCircle size={15} className="shrink-0" />
                                                    <span>{error}</span>
                                                </div>
                                            )}

                                            {loadingWallets ? (
                                                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                                    <Loader2 className="h-6 w-6 animate-spin text-blue-600 mb-1" />
                                                    <span className="text-[10px] font-bold">جاري جلب المحافظ النشطة...</span>
                                                </div>
                                            ) : wallets.length === 0 ? (
                                                <div className="py-6 text-center text-xs text-slate-400 font-bold border border-slate-200 border-dashed rounded-xl bg-slate-50">
                                                    عفواً، لا توجد محافظ سداد نشطة حالياً. يرجى مراجعة خدمة العملاء.
                                                </div>
                                            ) : (
                                                <div className="space-y-5">
                                                    
                                                    {/* Grid of active wallets */}
                                                    <div>
                                                        <span className="text-[10px] font-black text-slate-450 block mb-2.5">اختر محفظة التحويل الإلكتروني المفضلة لديك:</span>
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                                            {wallets.map((wallet) => (
                                                                <button
                                                                    key={wallet.id}
                                                                    type="button"
                                                                    onClick={() => setSelectedWallet(wallet)}
                                                                    className={`px-4.5 py-3 rounded-2xl border text-right text-xs font-bold transition-all flex items-center justify-start gap-2.5 ${
                                                                        selectedWallet?.id === wallet.id
                                                                            ? "border-[#16539a] bg-blue-50/20 text-[#16539a] shadow-sm ring-2 ring-blue-500/10"
                                                                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-350"
                                                                    }`}
                                                                    disabled={submitting}
                                                                >
                                                                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] shrink-0 ${
                                                                        selectedWallet?.id === wallet.id ? "bg-blue-600 text-white" : "bg-slate-200 text-transparent"
                                                                    }`}>
                                                                        ✓
                                                                    </div>
                                                                    <span className="truncate">{wallet.name}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Selected Wallet Details & Instructions Card */}
                                                    {selectedWallet && (
                                                        <motion.div 
                                                            key={selectedWallet.id}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="border border-slate-200 p-5 rounded-3xl bg-white space-y-4 shadow-sm"
                                                        >
                                                            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                                                                {renderWalletLogo(selectedWallet)}
                                                                <div>
                                                                    <span className="font-bold text-slate-800 text-sm block">{selectedWallet.name}</span>
                                                                    <span className="text-[9px] text-slate-400 font-bold block mt-0.5">
                                                                        اسم صاحب الحساب: {selectedCurrencyAccount ? selectedCurrencyAccount.accountName : (selectedWallet.accountName || "بوابة الاعتماد المهني")}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Multiple accounts currency tabs */}
                                                            {selectedWallet.accounts && getParsedAccounts(selectedWallet).length > 1 && (
                                                                <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-3">
                                                                    {getParsedAccounts(selectedWallet).map((acc: any) => (
                                                                        <button
                                                                            key={acc.id}
                                                                            type="button"
                                                                            onClick={() => handleUpdateCurrency(acc.currency)}
                                                                            className={`px-3 py-1 rounded-xl border text-[9px] font-black transition-all ${
                                                                                selectedCurrencyAccount?.id === acc.id
                                                                                    ? "border-[#16539a] bg-blue-50/50 text-[#16539a] shadow-sm"
                                                                                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-350"
                                                                            }`}
                                                                            disabled={submitting}
                                                                        >
                                                                            حساب ({acc.currency === "SAR" ? "ريال سعودي" : acc.currency === "YER" ? "ريال يمني" : acc.currency})
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* Transfer Details and Copy Buttons */}
                                                            <div className="space-y-2 text-xs">
                                                                <div className="flex justify-between items-center bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                                                                    <div className="space-y-0.5 text-right">
                                                                        <span className="text-[10px] text-slate-450 font-black block">
                                                                            رقم التحويل المالي للمحفظة ({selectedCurrencyAccount?.currency || purchaseData.currency || "YER"}):
                                                                        </span>
                                                                        <span className="font-mono text-sm font-black text-slate-800 tracking-wide">
                                                                            {selectedCurrencyAccount ? selectedCurrencyAccount.accountNumber : (selectedWallet.accountNumber || "غير محدد")}
                                                                        </span>
                                                                    </div>
                                                                    
                                                                    <Button
                                                                        onClick={() => handleCopy(selectedCurrencyAccount ? selectedCurrencyAccount.accountNumber : selectedWallet.accountNumber)}
                                                                        type="button"
                                                                        variant="ghost"
                                                                        className="h-8 rounded-lg px-2 text-[10px] font-bold border border-slate-200 text-slate-550 hover:bg-white flex items-center gap-1 active:scale-95"
                                                                        disabled={submitting}
                                                                    >
                                                                        {copySuccess ? (
                                                                            <>
                                                                                <Check size={11} className="text-emerald-500" />
                                                                                <span className="text-emerald-600">تم النسخ</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Copy size={11} />
                                                                                <span>نسخ الرقم</span>
                                                                            </>
                                                                        )}
                                                                    </Button>
                                                                </div>

                                                                <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-100 space-y-2.5 text-right">
                                                                    <div className="flex justify-between items-center text-xs font-bold text-slate-655">
                                                                        <span>رسوم الباقة والتسجيل:</span>
                                                                        <span className="font-mono text-slate-800">{getCalculatedBreakdown().baseAndReg.toLocaleString()} {getCalculatedBreakdown().currencyText}</span>
                                                                    </div>
                                                                    {pkg.includesTransport && (
                                                                        <div className="flex justify-between items-center text-xs font-bold text-slate-655 border-t border-slate-100/60 pt-2.5">
                                                                            <span>رسوم المواصلات:</span>
                                                                            <span className="font-mono text-slate-800">{getCalculatedBreakdown().transportCost.toLocaleString()} {getCalculatedBreakdown().currencyText}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex justify-between items-center text-sm font-black text-[#16539a] border-t border-slate-200 pt-2.5 mt-1">
                                                                        <span>إجمالي المبلغ المطلوب:</span>
                                                                        <span className="font-mono">{purchaseData.amount.toLocaleString()} {purchaseData.currency === "SAR" ? "ريال سعودي" : "ريال يمني"}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Reference verification and instructions based on status */}
                                                            <div className="pt-4 border-t border-slate-100 space-y-4">
                                                                {/* System Generated Reference Number (Always Displayed) */}
                                                                <div className="bg-slate-50 border border-slate-200/60 p-4.5 rounded-2xl space-y-2 text-right">
                                                                    <span className="text-[10px] text-slate-500 font-bold block">الرقم المرجعي للعملية (هام جداً):</span>
                                                                    <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200/50">
                                                                        <span className="font-mono text-base font-black text-slate-800 tracking-wider">
                                                                            {purchaseData.transactionRef}
                                                                        </span>
                                                                        <Button
                                                                            onClick={() => handleCopy(purchaseData.transactionRef)}
                                                                            type="button"
                                                                            variant="ghost"
                                                                            className="h-8 rounded-lg px-2 text-[10px] font-bold border border-slate-200 text-slate-550 hover:bg-slate-50 flex items-center gap-1 active:scale-95"
                                                                        >
                                                                            {copySuccess ? (
                                                                                <>
                                                                                    <Check size={11} className="text-emerald-500" />
                                                                                    <span className="text-emerald-600">تم النسخ</span>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Copy size={11} />
                                                                                    <span>نسخ الرقم</span>
                                                                                </>
                                                                            )}
                                                                        </Button>
                                                                    </div>
                                                                    <p className="text-[9px] text-slate-450 leading-relaxed">
                                                                        ⚠️ يرجى كتابة هذا الرقم المرجعي في خانة الملاحظات أو سبب التحويل لتسهيل التفعيل التلقائي الفوري.
                                                                    </p>
                                                                </div>

                                                                {/* ── STATUS: WAITING SMS ── */}
                                                                {verificationStatus === "waiting_sms" && (
                                                                    <div className="bg-blue-50/50 border border-blue-100 p-4.5 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                                                                        <div className="flex items-center gap-2 text-[#16539a]">
                                                                            <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                                                                            <span className="text-xs font-bold">جاري التحقق تلقائياً من وصول الحوالة...</span>
                                                                        </div>
                                                                        
                                                                        {/* Timer visualization */}
                                                                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                                                            <motion.div 
                                                                                className="bg-[#16539a] h-full"
                                                                                initial={{ width: "100%" }}
                                                                                animate={{ width: `${(timeLeft / 60) * 100}%` }}
                                                                                transition={{ duration: 1, ease: "linear" }}
                                                                            />
                                                                        </div>
                                                                        <span className="text-xs font-black text-slate-700 font-sans">
                                                                            متبقي {timeLeft} ثانية
                                                                        </span>
                                                                        <p className="text-[9.5px] text-slate-450 leading-relaxed max-w-xs">
                                                                            بمجرد وصول رسالة التحويل من البنك أو المحفظة للنظام، سيتم تفعيل حسابك تلقائياً دون إرفاق أي مستندات. يرجى إتمام التحويل والانتظار.
                                                                        </p>
                                                                    </div>
                                                                )}

                                                                {/* ── STATUS: TIMEOUT ── */}
                                                                {verificationStatus === "timeout" && (
                                                                    <form onSubmit={handleManualSubmit} className="space-y-4">
                                                                        <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl flex gap-2.5 items-start">
                                                                            <AlertCircle className="text-amber-600 h-4.5 w-4.5 shrink-0 mt-0.5" />
                                                                            <div className="space-y-1 text-right">
                                                                                <span className="text-xs font-bold text-amber-800 block">انتهى وقت التحقق التلقائي</span>
                                                                                <p className="text-[10px] text-amber-700 leading-relaxed">
                                                                                    لم نتمكن من العثور على الحوالة تلقائياً. يرجى إرفاق صورة إشعار أو سند التحويل المالي وسنقوم بتفعيل حسابك فوراً بالتواصل مع الدعم الفني عبر الواتساب.
                                                                                </p>
                                                                            </div>
                                                                        </div>

                                                                        <div className="space-y-2">
                                                                            <label className="text-xs font-bold text-slate-655 block">إرفاق صورة إشعار أو سند التحويل *</label>
                                                                            <div className="relative border-2 border-dashed border-slate-200 hover:border-slate-350 bg-slate-50/30 rounded-2xl p-6 text-center transition-all">
                                                                                <input 
                                                                                    type="file" 
                                                                                    accept="image/*" 
                                                                                    onChange={(e) => {
                                                                                        if (e.target.files && e.target.files[0]) {
                                                                                            setProofFile(e.target.files[0]);
                                                                                        }
                                                                                    }}
                                                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                                                    required
                                                                                    disabled={submitting}
                                                                                />
                                                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                                                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 shadow-sm">
                                                                                        <Image className="h-5 w-5" />
                                                                                    </div>
                                                                                    {proofFile ? (
                                                                                        <span className="text-xs font-bold text-slate-700">{proofFile.name}</span>
                                                                                    ) : (
                                                                                        <>
                                                                                            <span className="text-xs font-bold text-slate-500">اسحب صورة السند هنا أو اضغط للاختيار</span>
                                                                                            <span className="text-[9px] text-slate-400">الصيغ المقبولة: JPG, PNG, GIF</span>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <Button 
                                                                            type="submit" 
                                                                            className="w-full rounded-2xl h-12 text-xs font-black text-white bg-gradient-to-r from-[#16539a] to-[#5c9e45] shadow-lg shadow-blue-100 flex items-center justify-center gap-2 active:scale-98 transition-all"
                                                                            disabled={submitting || !proofFile}
                                                                        >
                                                                            {submitting ? (
                                                                                <>
                                                                                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                                                                                    <span>جاري رفع السند والتوجيه للواتساب...</span>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <MessageSquare size={16} />
                                                                                    <span>رفع السند والتواصل عبر الدعم</span>
                                                                                </>
                                                                            )}
                                                                        </Button>
                                                                    </form>
                                                                )}
                                                            </div>

                                                        </motion.div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>

                </div>

            </div>

            {/* Footer */}
            <div className="mt-28">
                <Footer />
            </div>
        </main>
    );
}
