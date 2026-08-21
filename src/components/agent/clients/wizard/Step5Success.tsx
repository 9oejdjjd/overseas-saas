import React, { useState, useEffect } from "react";
import { Check, Copy, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Step5SuccessProps {
    links: string[];
    onReset: () => void;
    onClose: () => void;
}

export function Step5Success({
    links = [],
    onReset,
    onClose
}: Step5SuccessProps) {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [countdown, setCountdown] = useState(5);

    // Auto close and redirect after 5 seconds
    useEffect(() => {
        if (countdown <= 0) {
            onClose();
            return;
        }
        const timer = setTimeout(() => {
            setCountdown(prev => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [countdown, onClose]);

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="space-y-6 text-center py-8 text-right flex flex-col items-center justify-center">
            {/* Animated Emerald Checkmark */}
            <div className="flex flex-col items-center justify-center mb-4">
                <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/20 text-[#55943b] rounded-full flex items-center justify-center border border-emerald-100 shadow-sm"
                >
                    <motion.svg 
                        className="w-10 h-10 stroke-current text-emerald-600" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    >
                        <motion.polyline 
                            points="20 6 9 17 4 12"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        />
                    </motion.svg>
                </motion.div>
            </div>

            <h2 className="text-2xl font-black text-gray-900 dark:text-white">تم تأكيد الطلب بنجاح!</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed font-semibold">
                تم تأكيد طلب الاختبارات بنجاح وإنشاء الروابط المخصصة للمتقدمين. يمكنك نسخ الروابط أدناه ومشاركتها معهم مباشرة لبدء الاختبار.
            </p>

            {links.length > 0 && (
                <div className="w-full max-w-md mt-6 space-y-3">
                    <h3 className="text-xs font-black text-gray-700 dark:text-slate-300 text-right mb-2 pr-1">روابط الاختبارات ({links.length}):</h3>
                    {links.map((link, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-150 dark:border-slate-700 bg-white">
                            <Input readOnly value={link} className="bg-transparent border-none dir-ltr text-left text-xs font-semibold focus-visible:ring-0 focus-visible:ring-offset-0" />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => copyToClipboard(link, idx)}
                                className={cn("shrink-0 bg-white rounded-lg h-8 w-8 border-slate-250", copiedIndex === idx && "text-green-600 border-green-600")}
                            >
                                {copiedIndex === idx ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Countdown Redirect Alert */}
            <div className="pt-6 flex items-center gap-2 text-xs text-indigo-650 font-bold bg-indigo-50/50 border border-indigo-100 px-5 py-2.5 rounded-xl animate-pulse">
                <Clock className="w-4 h-4" />
                <span>سيتم توجيهك تلقائياً إلى قائمة العملاء خلال {countdown} ثوانٍ...</span>
            </div>
        </div>
    );
}
